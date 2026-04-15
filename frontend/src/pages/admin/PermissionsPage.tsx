import { useEffect, useState, useCallback, useMemo } from 'react';
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

const PAGE_SIZES = [10, 25, 50, 100] as const;

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

  // Profile form (modal)
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ name: '', permissions: new Set() });

  // User assignment filters & pagination
  const [userFilterName, setUserFilterName] = useState('');
  const [userFilterEmail, setUserFilterEmail] = useState('');
  const [userFilterProfile, setUserFilterProfile] = useState('');
  const [userPageSize, setUserPageSize] = useState<number>(10);
  const [userPage, setUserPage] = useState(1);

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

  // --- Filtered + paginated users ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userFilterName && !u.displayName.toLowerCase().includes(userFilterName.toLowerCase())) return false;
      if (userFilterEmail && !u.email.toLowerCase().includes(userFilterEmail.toLowerCase())) return false;
      if (userFilterProfile) {
        if (userFilterProfile === '__none__') {
          if (u.permissionProfileName) return false;
        } else {
          if (u.permissionProfileName !== userFilterProfile) return false;
        }
      }
      return true;
    });
  }, [users, userFilterName, userFilterEmail, userFilterProfile]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Reset page when filters or page size change
  useEffect(() => {
    setUserPage(1);
  }, [userFilterName, userFilterEmail, userFilterProfile, userPageSize]);

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

  const handleOpenCreateModal = () => {
    setEditingProfileId(null);
    setProfileForm({ name: '', permissions: new Set() });
    setShowProfileModal(true);
    setSuccess('');
    setError('');
  };

  const handleOpenEditModal = (profile: PermissionProfile) => {
    setEditingProfileId(profile.id);
    setProfileForm({ name: profile.name, permissions: new Set(profile.permissions) });
    setShowProfileModal(true);
    setSuccess('');
    setError('');
  };

  const handleCloseProfileModal = () => {
    setEditingProfileId(null);
    setShowProfileModal(false);
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
      handleCloseProfileModal();
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

  const handleInlineAssign = async (userId: number, profileIdStr: string) => {
    setIsMutating(true);
    setError('');
    setSuccess('');
    try {
      const profileId = profileIdStr ? Number(profileIdStr) : null;
      await assignUserProfile(userId, profileId);
      setSuccess('Profile assigned.');
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

  const renderProfileModal = () => {
    if (!showProfileModal) return null;
    const isEditing = editingProfileId !== null;
    return (
      <div
        className="teams-modal-overlay"
        role="presentation"
        onClick={(e) => { if (e.target === e.currentTarget && !isMutating) handleCloseProfileModal(); }}
        onKeyDown={(e) => { if (e.key === 'Escape' && !isMutating) handleCloseProfileModal(); }}
      >
        <section
          className="teams-modal teams-modal--wide"
          role="dialog"
          aria-modal="true"
          aria-label={isEditing ? 'Edit Permission Profile' : 'Create Permission Profile'}
          onClick={(e) => e.stopPropagation()}
        >
          <h2>{isEditing ? 'Edit Permission Profile' : 'Create Permission Profile'}</h2>

          <div className="permission-modal-top-actions">
            <button type="button" className="btn btn-primary" onClick={() => void handleSaveProfile()} disabled={isMutating}>
              {isMutating ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
            <button type="button" className="teams-action-btn teams-action-btn--reject" onClick={handleCloseProfileModal} disabled={isMutating}>
              Cancel
            </button>
          </div>

          <div className="modal-form">
            <label>
              Profile Name
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isMutating}
              />
            </label>
          </div>

          <div className="permission-modal-body">
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
        </section>
      </div>
    );
  };

  const renderProfilesTab = () => (
    <div className="profiles-tab">
      <div className="tab-header">
        <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal} disabled={showProfileModal}>
          New Profile
        </button>
      </div>

      {renderProfileModal()}

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
                  <div className="entity-actions">
                    {!profile.isBuiltIn && (
                      <>
                        <button type="button" className="icon-btn" onClick={() => handleOpenEditModal(profile)} disabled={isMutating || showProfileModal} title="Edit profile" aria-label={`Edit ${profile.name}`}>
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

  const renderUsersTab = () => {
    const getCurrentProfileId = (user: UserWithPermissions): string => {
      const profile = profiles.find((p) => p.name === user.permissionProfileName);
      return profile ? String(profile.id) : '';
    };

    return (
      <div className="users-tab">
        <div className="toolbar-card">
          <div className="permission-filter-row">
            <input
              type="text"
              placeholder="Filter by name"
              value={userFilterName}
              onChange={(e) => setUserFilterName(e.target.value)}
              aria-label="Filter by user name"
            />
            <input
              type="text"
              placeholder="Filter by email"
              value={userFilterEmail}
              onChange={(e) => setUserFilterEmail(e.target.value)}
              aria-label="Filter by email"
            />
            <select
              value={userFilterProfile}
              onChange={(e) => setUserFilterProfile(e.target.value)}
              aria-label="Filter by profile"
            >
              <option value="">All profiles</option>
              <option value="__none__">No profile</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn"
              onClick={() => { setUserFilterName(''); setUserFilterEmail(''); setUserFilterProfile(''); }}
              title="Clear Filters"
              aria-label="Clear Filters"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
          </div>
          <div className="permission-filter-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              Show
              <select
                value={userPageSize}
                onChange={(e) => setUserPageSize(Number(e.target.value))}
                aria-label="Page size"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              per page
            </label>
          </div>
        </div>

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
              {paginatedUsers.map((user) => {
                const isUser1 = user.id === 1;
                const superAdminProfile = profiles.find((p) => p.isBuiltIn);
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.displayName}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="inline-profile-select"
                        value={getCurrentProfileId(user)}
                        onChange={(e) => void handleInlineAssign(user.id, e.target.value)}
                        disabled={isMutating}
                        aria-label={`Profile for ${user.displayName}`}
                      >
                        {!(isUser1 && superAdminProfile) && <option value="">No profile</option>}
                        {profiles.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td />
                  </tr>
                );
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={3}>No users match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {userTotalPages > 1 && (
          <div className="pagination-row">
            <button type="button" disabled={userPage <= 1} onClick={() => setUserPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {userPage} of {userTotalPages} ({filteredUsers.length} users)</span>
            <button type="button" disabled={userPage >= userTotalPages} onClick={() => setUserPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

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
      <div className="toolbar-card">
        <div className="permission-filter-row">
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
          <button type="button" className="icon-btn" onClick={() => void handleApplyUsageFilters()} disabled={usageLoading || isDownloadingCsv} title="Apply Filters" aria-label="Apply Filters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 2.5h13l-5 5.5v4l-3 2v-6L1.5 2.5z" /></svg>
          </button>
          <button type="button" className="icon-btn" onClick={() => void handleResetUsageFilters()} disabled={usageLoading || isDownloadingCsv} title="Clear Filters" aria-label="Clear Filters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>
        <button type="button" className="icon-btn" onClick={() => void handleDownloadUsageCsv()} disabled={isDownloadingCsv} title="Download CSV" aria-label="Download CSV">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8m-3-3l3 3 3-3" /><path d="M2 12v2h12v-2" /></svg>
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
      <div className="toolbar-card">
        <div className="permission-filter-row">
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
          <button type="button" className="icon-btn" onClick={() => { setAuditPage(1); void loadAuditLog(1); }} disabled={auditLoading} title="Apply Filters" aria-label="Apply Filters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 2.5h13l-5 5.5v4l-3 2v-6L1.5 2.5z" /></svg>
          </button>
          <button type="button" className="icon-btn" onClick={() => {
            setAuditEventType('');
            setAuditDateFrom('');
            setAuditDateTo('');
            setAuditSearch('');
            setAuditPage(1);
            void loadAuditLog(1);
          }} disabled={auditLoading} title="Clear Filters" aria-label="Clear Filters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => void handleDownloadAuditCsv()}
          disabled={isDownloadingCsv || auditLoading}
          title="Download CSV"
          aria-label="Download CSV"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8m-3-3l3 3 3-3" /><path d="M2 12v2h12v-2" /></svg>
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
        <div className="pagination-row">
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
