import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { PermissionCatalogEntry, PermissionProfile, UserWithPermissions } from '../../lib/api.models';
import {
  getAdminUsers,
  getPermissionCatalog,
  getPermissionProfiles,
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

type Tab = 'profiles' | 'users';

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMutating, setIsMutating] = useState(false);

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
          <fieldset key={category} className="permission-category">
            <legend>{category}</legend>
            {entries.map((entry) => (
              <label key={entry.key} className="permission-checkbox">
                <input
                  type="checkbox"
                  checked={profileForm.permissions.has(entry.key)}
                  onChange={() => handleTogglePermission(entry.key)}
                  disabled={isMutating}
                />
                <span className="permission-label">{entry.key}</span>
                <span className="permission-desc">{entry.description}</span>
              </label>
            ))}
          </fieldset>
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

      {showCreateForm && renderPermissionForm()}

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
                          <button type="button" onClick={() => handleStartEdit(profile)} disabled={isMutating}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => void handleDeleteProfile(profile.id)}
                            disabled={isMutating || profile.userCount > 0}
                            title={profile.userCount > 0 ? 'Unassign all users first' : undefined}
                          >
                            Delete
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
                        className="primary"
                        onClick={() => void handleSaveAssignment()}
                        disabled={isMutating}
                      >
                        {isMutating ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setAssigningUserId(null)} disabled={isMutating}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => handleStartAssign(user.id)}>
                      Change
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
          </div>
          {activeTab === 'profiles' ? renderProfilesTab() : renderUsersTab()}
        </>
      )}
    </section>
  );
}
