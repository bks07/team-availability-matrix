import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api.config';
import type {
  AuditLogEntry,
  PermissionCatalogEntry,
  PermissionProfile,
  UsageReportEntry,
  UserWithPermissions,
} from '../../lib/api.models';
import { currentToken } from '../../lib/storage';
import {
  getUsageReport,
  getUsageReportCsvUrl,
  getAuditLogCsvUrl,
  getAdminUsers,
  getPermissionCatalog,
  getPermissionProfiles,
  getAuditLog,
  createPermissionProfile,
  updatePermissionProfile,
  deletePermissionProfile,
  assignUserProfile,
} from '../../services/permission.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

type Tab = 'profiles' | 'users' | 'usage-report' | 'audit-log';

interface ProfileFormState {
  name: string;
  permissions: Set<string>;
}

export default function PermissionsPage(): JSX.Element {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<PermissionProfile[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [usageReport, setUsageReport] = useState<UsageReportEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const [usageProfileName, setUsageProfileName] = useState('');
  const [usageUserName, setUsageUserName] = useState('');

  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(25);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditEventType, setAuditEventType] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Profile form
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ name: '', permissions: new Set() });

  // User assignment
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  const canManageProfiles = currentUser?.permissions.includes('permission_profiles.view') ?? false;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profilesRes, catalogRes, usersRes] = await Promise.all([
        getPermissionProfiles(),
        getPermissionCatalog(),
        getAdminUsers(),
      ]);
      setProfiles(profilesRes);
      setCatalog(catalogRes);
      setUsers(usersRes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageProfiles) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [canManageProfiles, loadData]);

  const loadUsageReport = useCallback(
    async (filters?: { profileName?: string; userName?: string }) => {
      setUsageLoading(true);
      setError('');
      try {
        const report = await getUsageReport(filters);
        setUsageReport(report);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setUsageLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!canManageProfiles || activeTab !== 'usage-report') {
      return;
    }

    if (usageReport.length === 0 && !usageLoading) {
      void loadUsageReport();
    }
  }, [activeTab, canManageProfiles, loadUsageReport, usageLoading, usageReport.length]);

  const loadAuditLog = useCallback(async (page?: number) => {
    setAuditLoading(true);
    setError('');
    try {
      const result = await getAuditLog({
        page: page ?? auditPage,
        pageSize: auditPageSize,
        eventType: auditEventType.trim() || undefined,
        dateFrom: auditDateFrom || undefined,
        dateTo: auditDateTo || undefined,
        search: auditSearch.trim() || undefined,
      });
      setAuditEntries(result.entries);
      setAuditTotal(result.total);
      setAuditPage(result.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditPageSize, auditEventType, auditDateFrom, auditDateTo, auditSearch]);

  useEffect(() => {
    if (!canManageProfiles || activeTab !== 'audit-log') return;
    void loadAuditLog();
  }, [activeTab, canManageProfiles]);

  const categories = catalog.reduce<Map<string, PermissionCatalogEntry[]>>((acc, entry) => {
    const list = acc.get(entry.category) ?? [];
    list.push(entry);
    acc.set(entry.category, list);
    return acc;
  }, new Map());

  const handleTogglePermission = (key: string) => {
    setProfileForm((prev) => {
      const next = new Set(prev.permissions);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { ...prev, permissions: next };
    });
  };

  const handleStartCreate = () => {
    setEditingProfileId(null);
    setProfileForm({ name: '', permissions: new Set() });
    setShowCreateForm(true);
    setSuccess('');
    setError('');
  };

  const handleStartEdit = (profile: PermissionProfile) => {
    setShowCreateForm(false);
    setEditingProfileId(profile.id);
    setProfileForm({ name: profile.name, permissions: new Set(profile.permissions) });
    setSuccess('');
    setError('');
  };

  const handleCancelForm = () => {
    setEditingProfileId(null);
    setShowCreateForm(false);
    setProfileForm({ name: '', permissions: new Set() });
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      setError('Profile name is required');
      return;
    }
    setIsMutating(true);
    setError('');
    setSuccess('');
    try {
      const perms = Array.from(profileForm.permissions);
      if (editingProfileId) {
        await updatePermissionProfile(editingProfileId, profileForm.name.trim(), perms);
        setSuccess('Profile updated.');
      } else {
        await createPermissionProfile(profileForm.name.trim(), perms);
        setSuccess('Profile created.');
      }
      handleCancelForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    setIsMutating(true);
    setError('');
    setSuccess('');
    try {
      await deletePermissionProfile(id);
      setSuccess('Profile deleted.');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleStartAssign = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    const currentProfile = profiles.find((p) => p.name === user?.permissionProfileName);
    setAssigningUserId(userId);
    setSelectedProfileId(currentProfile ? String(currentProfile.id) : '');
    setSuccess('');
    setError('');
  };

  const handleSaveAssignment = async () => {
    if (assigningUserId === null) return;
    setIsMutating(true);
    setError('');
    setSuccess('');
    try {
      const profileId = selectedProfileId ? Number(selectedProfileId) : null;
      await assignUserProfile(assigningUserId, profileId);
      setSuccess('Profile assigned.');
      setAssigningUserId(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  if (!canManageProfiles) {
    return (
      <section className="guard-message">
        <h2>403 - Access denied</h2>
        <p>You do not have permission to manage permissions.</p>
        <Link to="/admin/locations">Return to admin dashboard</Link>
      </section>
    );
  }

  const renderPermissionForm = () => (
    <div className="permission-form">
      <div className="form-group">
        <label htmlFor="profile-name">Profile Name</label>
        <input
          id="profile-name"
          type="text"
          value={profileForm.name}
          onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
          disabled={isMutating}
        />
      </div>

      <div className="permission-categories">
        {Array.from(categories.entries()).map(([category, entries]) => (
          <div key={category}>
            <h3>{category}</h3>
            <table className="permission-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.key}>
                    <td>{entry.key}</td>
                    <td>{entry.description}</td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={profileForm.permissions.has(entry.key)}
                        aria-label={`Toggle ${entry.key}`}
                        className={`toggle-slider${profileForm.permissions.has(entry.key) ? ' active' : ''}`}
                        disabled={isMutating}
                        onClick={() => handleTogglePermission(entry.key)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="primary" onClick={() => void handleSaveProfile()} disabled={isMutating}>
          {isMutating ? 'Saving...' : editingProfileId ? 'Update Profile' : 'Create Profile'}
        </button>
        <button type="button" onClick={handleCancelForm} disabled={isMutating}>
          Cancel
        </button>
      </div>
    </div>
  );

  const renderProfilesTab = () => (
    <div className="profiles-tab">
      <div className="tab-header">
        <button type="button" className="primary" onClick={handleStartCreate} disabled={showCreateForm || editingProfileId !== null}>
          New Profile
        </button>
      </div>

      {showCreateForm && (
        <div
          className="teams-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelForm(); }}
        >
          <div className="teams-modal" role="dialog" aria-modal="true" aria-label="Create Permission Profile">
            <h2>Create Permission Profile</h2>
            {renderPermissionForm()}
          </div>
        </div>
      )}

      <div className="matrix-wrapper">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Permissions</th>
              <th>Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <strong>{profile.name}</strong>
                  {profile.isBuiltIn && <span className="badge built-in">Built-in</span>}
                </td>
                <td>{profile.permissions.length}</td>
                <td>{profile.userCount}</td>
                <td>
                  {editingProfileId === profile.id ? (
                    renderPermissionForm()
                  ) : (
                    <div className="action-buttons">
                      {!profile.isBuiltIn && (
                        <>
                          <button type="button" className="icon-btn" onClick={() => handleStartEdit(profile)} disabled={isMutating} title="Edit profile" aria-label={`Edit ${profile.name}`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => void handleDeleteProfile(profile.id)}
                            disabled={isMutating || profile.userCount > 0}
                            title={profile.userCount > 0 ? 'Unassign all users first' : 'Delete profile'}
                            aria-label={`Delete ${profile.name}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4}>No permission profiles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="users-tab">
      <div className="matrix-wrapper">
        <table className="permission-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Current Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.displayName}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </td>
                <td>{user.permissionProfileName ?? <em>None</em>}</td>
                <td>
                  {assigningUserId === user.id ? (
                    <div className="assign-form">
                      <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        disabled={isMutating}
                      >
                        <option value="">No profile</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => void handleSaveAssignment()}
                        disabled={isMutating}
                        title="Save"
                        aria-label="Save assignment"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 8.5l4 4L14 3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setAssigningUserId(null)}
                        disabled={isMutating}
                        title="Cancel"
                        aria-label="Cancel assignment"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l10 10M13 3L3 13" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleStartAssign(user.id)}
                      title="Change profile"
                      aria-label={`Change profile for ${user.displayName}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4h14M1 12h14M4 1l-3 3 3 3M12 10l3 3-3 3" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleApplyUsageFilters = async () => {
    await loadUsageReport({
      profileName: usageProfileName.trim() || undefined,
      userName: usageUserName.trim() || undefined,
    });
  };

  const handleResetUsageFilters = async () => {
    setUsageProfileName('');
    setUsageUserName('');
    await loadUsageReport();
  };

  const handleDownloadUsageCsv = async () => {
    setIsDownloadingCsv(true);
    setError('');
    try {
      const baseURL = import.meta.env.DEV ? '/api' : API_BASE_URL;
      const token = currentToken();
      const response = await axios.get(`${baseURL}${getUsageReportCsvUrl()}`, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'permission-usage-report.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleDownloadAuditCsv = async () => {
    setIsDownloadingCsv(true);
    setError('');
    try {
      const baseURL = import.meta.env.DEV ? '/api' : API_BASE_URL;
      const token = currentToken();
      const response = await axios.get(`${baseURL}${getAuditLogCsvUrl()}`, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'permission-audit-log.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const renderUsageReportTab = () => (
    <div className="users-tab">
      <div className="tab-header toolbar-card">
        <div className="assign-form">
          <input
            type="text"
            placeholder="Filter by profile name"
            value={usageProfileName}
            onChange={(e) => setUsageProfileName(e.target.value)}
            disabled={usageLoading || isDownloadingCsv}
          />
          <input
            type="text"
            placeholder="Filter by user name"
            value={usageUserName}
            onChange={(e) => setUsageUserName(e.target.value)}
            disabled={usageLoading || isDownloadingCsv}
          />
          <button type="button" onClick={() => void handleApplyUsageFilters()} disabled={usageLoading || isDownloadingCsv}>
            {usageLoading ? 'Filtering...' : 'Apply Filters'}
          </button>
          <button type="button" onClick={() => void handleResetUsageFilters()} disabled={usageLoading || isDownloadingCsv}>
            Reset
          </button>
        </div>
        <button type="button" className="primary" onClick={() => void handleDownloadUsageCsv()} disabled={isDownloadingCsv}>
          {isDownloadingCsv ? 'Downloading...' : 'Download CSV'}
        </button>
      </div>

      <div className="matrix-wrapper">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Display Name</th>
              <th>Email</th>
              <th>Profile Name</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {usageReport.map((entry) => (
              <tr key={entry.userId}>
                <td>{entry.displayName}</td>
                <td>{entry.email}</td>
                <td>{entry.profileName ?? <em>None</em>}</td>
                <td>{entry.permissions.length > 0 ? entry.permissions.join(', ') : <em>None</em>}</td>
              </tr>
            ))}
            {!usageLoading && usageReport.length === 0 && (
              <tr>
                <td colSpan={4}>No usage report entries found.</td>
              </tr>
            )}
            {usageLoading && (
              <tr>
                <td colSpan={4}>Loading usage report...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const eventTypeOptions = ['profile_created', 'profile_updated', 'profile_deleted', 'profile_assigned', 'profile_unassigned'];

  const totalPages = Math.ceil(auditTotal / auditPageSize);

  const formatEventType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderAuditLogTab = () => (
    <div className="users-tab">
      <div className="tab-header toolbar-card">
        <div className="assign-form">
          <select
            value={auditEventType}
            onChange={(e) => setAuditEventType(e.target.value)}
            disabled={auditLoading}
          >
            <option value="">All event types</option>
            {eventTypeOptions.map((type) => (
              <option key={type} value={type}>{formatEventType(type)}</option>
            ))}
          </select>
          <input
            type="date"
            value={auditDateFrom}
            onChange={(e) => setAuditDateFrom(e.target.value)}
            disabled={auditLoading}
            placeholder="From date"
          />
          <input
            type="date"
            value={auditDateTo}
            onChange={(e) => setAuditDateTo(e.target.value)}
            disabled={auditLoading}
            placeholder="To date"
          />
          <input
            type="text"
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            disabled={auditLoading}
            placeholder="Search admin, user, or profile"
          />
          <button type="button" onClick={() => { setAuditPage(1); void loadAuditLog(1); }} disabled={auditLoading}>
            {auditLoading ? 'Loading...' : 'Apply'}
          </button>
          <button type="button" onClick={() => {
            setAuditEventType('');
            setAuditDateFrom('');
            setAuditDateTo('');
            setAuditSearch('');
            setAuditPage(1);
            void loadAuditLog(1);
          }} disabled={auditLoading}>
            Reset
          </button>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => void handleDownloadAuditCsv()}
          disabled={isDownloadingCsv || auditLoading}
        >
          {isDownloadingCsv ? 'Downloading...' : 'Download CSV'}
        </button>
      </div>

      <div className="matrix-wrapper">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Event</th>
              <th>Profile</th>
              <th>User</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                <td>{entry.adminName}</td>
                <td>{formatEventType(entry.eventType)}</td>
                <td>{entry.profileName ?? <em>-</em>}</td>
                <td>{entry.targetUserName ?? <em>-</em>}</td>
                <td>
                  <details>
                    <summary>View</summary>
                    <pre style={{ fontSize: '0.75rem', maxWidth: '300px', overflow: 'auto' }}>
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {!auditLoading && auditEntries.length === 0 && (
              <tr><td colSpan={6}>No audit log entries found.</td></tr>
            )}
            {auditLoading && (
              <tr><td colSpan={6}>Loading audit log...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="form-actions" style={{ justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" disabled={auditPage <= 1 || auditLoading} onClick={() => { setAuditPage(p => p - 1); void loadAuditLog(auditPage - 1); }}>
            Previous
          </button>
          <span>Page {auditPage} of {totalPages} ({auditTotal} entries)</span>
          <button type="button" disabled={auditPage >= totalPages || auditLoading} onClick={() => { setAuditPage(p => p + 1); void loadAuditLog(auditPage + 1); }}>
            Next
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="admin-management">
      <h2>Permission Management</h2>

      {error && <p className="admin-alert error">{error}</p>}
      {success && <p className="admin-alert success">{success}</p>}

      {loading ? (
        <p className="message">Loading...</p>
      ) : (
        <>
          <div className="tab-bar">
            <button
              type="button"
              className={activeTab === 'profiles' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('profiles')}
            >
              Profiles
            </button>
            <button
              type="button"
              className={activeTab === 'users' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('users')}
            >
              User Assignments
            </button>
            <button
              type="button"
              className={activeTab === 'usage-report' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('usage-report')}
            >
              Usage Report
            </button>
            <button
              type="button"
              className={activeTab === 'audit-log' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('audit-log')}
            >
              Audit Log
            </button>
          </div>
          {activeTab === 'profiles' && renderProfilesTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'usage-report' && renderUsageReportTab()}
          {activeTab === 'audit-log' && renderAuditLogTab()}
        </>
      )}
    </section>
  );
}
