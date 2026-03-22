import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserWithPermissions } from '../../lib/api.models';
import { getAdminUsers, updateUserPermissions } from '../../services/permission.service';

const KNOWN_PERMISSIONS = ['admin', 'manage_locations', 'manage_public_holidays', 'super_admin'] as const;

const PERMISSION_LABELS: Record<(typeof KNOWN_PERMISSIONS)[number], string> = {
  admin: 'Admin',
  manage_locations: 'Manage Locations',
  manage_public_holidays: 'Manage Public Holidays',
  super_admin: 'Super Admin'
};

function areSamePermissionSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((permission) => rightSet.has(permission));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unable to load or update permissions. Please try again.';
}

export default function PermissionsPage(): JSX.Element {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [editedPermissions, setEditedPermissions] = useState<Map<number, string[]>>(new Map());
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successUserId, setSuccessUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = currentUser?.permissions.includes('super_admin') ?? false;

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getAdminUsers();
        setUsers(response);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [isSuperAdmin]);

  const userById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const handlePermissionToggle = (userId: number, permission: (typeof KNOWN_PERMISSIONS)[number]) => {
    const user = userById.get(userId);
    if (!user) {
      return;
    }

    const basePermissions = editedPermissions.get(userId) ?? user.permissions;
    const hasPermission = basePermissions.includes(permission);

    const nextPermissions = hasPermission
      ? basePermissions.filter((item) => item !== permission)
      : [...basePermissions, permission];

    setEditedPermissions((previous) => {
      const next = new Map(previous);
      next.set(userId, nextPermissions);
      return next;
    });

    setSuccessUserId((previous) => (previous === userId ? null : previous));
    setError('');
  };

  const handleSave = async (userId: number) => {
    const user = userById.get(userId);
    if (!user) {
      return;
    }

    const candidatePermissions = editedPermissions.get(userId);
    if (!candidatePermissions || areSamePermissionSet(candidatePermissions, user.permissions)) {
      return;
    }

    setSavingUserId(userId);
    setError('');
    setSuccessUserId(null);

    try {
      const response = await updateUserPermissions(userId, candidatePermissions);

      setUsers((previous) =>
        previous.map((item) =>
          item.id === userId
            ? {
                ...item,
                permissions: response.permissions
              }
            : item
        )
      );

      setEditedPermissions((previous) => {
        const next = new Map(previous);
        next.delete(userId);
        return next;
      });
      setSuccessUserId(userId);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      setSuccessUserId(null);
    } finally {
      setSavingUserId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <section className="guard-message">
        <h2>403 - Access denied</h2>
        <p>Only super administrators can access permission management.</p>
        <Link to="/admin/locations">Return to admin dashboard</Link>
      </section>
    );
  }

  return (
    <section className="admin-management">
      <h2>Permission Management</h2>

      {error ? <p className="admin-alert error">{error}</p> : null}

      {loading ? <p className="message">Loading users...</p> : null}

      {!loading ? (
        <div className="matrix-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>User</th>
                {KNOWN_PERMISSIONS.map((permission) => (
                  <th key={permission} className="checkbox-header">
                    {PERMISSION_LABELS[permission]}
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const candidatePermissions = editedPermissions.get(user.id) ?? user.permissions;
                const hasChanges = !areSamePermissionSet(candidatePermissions, user.permissions);
                const isSaving = savingUserId === user.id;

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.displayName}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>

                    {KNOWN_PERMISSIONS.map((permission) => {
                      const isSelfSuperAdminToggle =
                        permission === 'super_admin' && currentUser?.id === user.id;

                      return (
                        <td key={permission} className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={candidatePermissions.includes(permission)}
                            onChange={() => handlePermissionToggle(user.id, permission)}
                            disabled={isSelfSuperAdminToggle || isSaving}
                            title={
                              isSelfSuperAdminToggle
                                ? 'You cannot remove your own super admin privileges.'
                                : undefined
                            }
                          />
                        </td>
                      );
                    })}

                    <td>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => void handleSave(user.id)}
                        disabled={!hasChanges || isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      {successUserId === user.id ? <p className="admin-inline-success">Saved.</p> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
