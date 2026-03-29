import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { CreateUserRequest, Location, UpdateUserRequest, UserWithPermissions } from '../../lib/api.models';
import { getLocations } from '../../services/location.service';
import { bulkAssignLocation, createUser, deleteUser, getUsers, updateUser } from '../../services/user.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

interface UserFormState {
  email: string;
  displayName: string;
  password: string;
  locationId: number | null;
}

const INITIAL_FORM: UserFormState = {
  email: '',
  displayName: '',
  password: '',
  locationId: null
};

export default function UsersPage(): JSX.Element {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [newUserForm, setNewUserForm] = useState<UserFormState>(INITIAL_FORM);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUserForm, setEditUserForm] = useState<UserFormState>(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [bulkLocationValue, setBulkLocationValue] = useState('');
  const [selectionAnnouncement, setSelectionAnnouncement] = useState('No users selected.');

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  const locationNameById = useMemo(() => {
    return new Map(locations.map((location) => [location.id, location.name]));
  }, [locations]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        const [loadedUsers, loadedLocations] = await Promise.all([getUsers(), getLocations()]);
        setUsers(loadedUsers);
        setLocations(loadedLocations);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const selectedCount = selectedUserIds.size;
  const allSelected = users.length > 0 && selectedCount === users.length;
  const partiallySelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  useEffect(() => {
    const availableIds = new Set(users.map((user) => user.id));
    setSelectedUserIds((previous) => {
      const next = new Set<number>();
      previous.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id);
        }
      });
      return next.size === previous.size ? previous : next;
    });
  }, [users]);

  useEffect(() => {
    if (selectedCount === 0) {
      setSelectionAnnouncement('No users selected.');
      return;
    }

    setSelectionAnnouncement(`${selectedCount} user${selectedCount === 1 ? '' : 's'} selected.`);
  }, [selectedCount]);

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((previous) => {
      const next = new Set(previous);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
    setBulkLocationValue('');
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      clearSelection();
      return;
    }

    setSelectedUserIds(new Set(users.map((user) => user.id)));
  };

  const handleBulkAssign = async () => {
    if (!bulkLocationValue || selectedCount === 0) {
      return;
    }

    setIsBulkAssigning(true);
    setError('');
    setSuccess('');

    try {
      const locationId = bulkLocationValue === 'none' ? null : Number(bulkLocationValue);
      await bulkAssignLocation({
        userIds: Array.from(selectedUserIds),
        locationId
      });

      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers);
      clearSelection();
      setSuccess('Locations updated successfully for selected users.');
    } catch (assignError) {
      setError(getErrorMessage(assignError));
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newUserForm.email.trim();
    const displayName = newUserForm.displayName.trim();
    const password = newUserForm.password;

    if (!email) {
      setError('Email is required.');
      setSuccess('');
      return;
    }

    if (!displayName) {
      setError('Display name is required.');
      setSuccess('');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    const payload: CreateUserRequest = {
      email,
      displayName,
      password,
      locationId: newUserForm.locationId
    };

    try {
      const created = await createUser(payload);
      setUsers((previous) => [created, ...previous]);
      setNewUserForm(INITIAL_FORM);
      setSuccess('User created successfully.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (user: UserWithPermissions) => {
    setEditingId(user.id);
    setEditUserForm({
      email: user.email,
      displayName: user.displayName,
      password: '',
      locationId: user.locationId ?? null
    });
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditUserForm(INITIAL_FORM);
  };

  const handleSaveEdit = async (id: number) => {
    const email = editUserForm.email.trim();
    const displayName = editUserForm.displayName.trim();

    if (!email) {
      setError('Email is required.');
      setSuccess('');
      return;
    }

    if (!displayName) {
      setError('Display name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    const payload: UpdateUserRequest = {
      email,
      displayName,
      locationId: editUserForm.locationId
    };

    const nextPassword = editUserForm.password.trim();
    if (nextPassword) {
      payload.password = nextPassword;
    }

    try {
      const updated = await updateUser(id, payload);
      setUsers((previous) => previous.map((user) => (user.id === id ? updated : user)));
      setEditingId(null);
      setEditUserForm(INITIAL_FORM);
      setSuccess('User updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (user: UserWithPermissions) => {
    const confirmed = window.confirm(`Delete user \"${user.displayName}\"?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await deleteUser(user.id);
      setUsers((previous) => previous.filter((item) => item.id !== user.id));
      if (editingId === user.id) {
        cancelEditing();
      }
      setSuccess('User deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="admin-management">
      <h2>User Management</h2>

      <div aria-live="polite">
        <p className="sr-only">{selectionAnnouncement}</p>
        {success ? <p className="admin-alert success">{success}</p> : null}
        {error ? <p className="admin-alert error">{error}</p> : null}
      </div>

      <form className="add-form" onSubmit={handleCreateUser}>
        <input
          type="email"
          value={newUserForm.email}
          onChange={(event) => setNewUserForm((previous) => ({ ...previous, email: event.target.value }))}
          placeholder="Email"
          disabled={isMutating}
          aria-label="User email"
        />
        <input
          type="text"
          value={newUserForm.displayName}
          onChange={(event) => setNewUserForm((previous) => ({ ...previous, displayName: event.target.value }))}
          placeholder="Display name"
          disabled={isMutating}
          aria-label="Display name"
        />
        <input
          type="password"
          value={newUserForm.password}
          onChange={(event) => setNewUserForm((previous) => ({ ...previous, password: event.target.value }))}
          placeholder="Password"
          disabled={isMutating}
          aria-label="Password"
        />
        <select
          value={newUserForm.locationId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setNewUserForm((previous) => ({ ...previous, locationId: value ? Number(value) : null }));
          }}
          disabled={isMutating}
          aria-label="User location"
        >
          <option value="">No location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <button type="submit" className="primary" disabled={isMutating}>
          Create User
        </button>
      </form>

      {loading ? <p className="message">Loading users...</p> : null}

      {!loading && users.length === 0 ? <p className="empty-state">No users found</p> : null}

      {!loading && users.length > 0 ? (
        <div className="matrix-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th className="checkbox-header">
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all users"
                    disabled={isMutating || isBulkAssigning}
                  />
                </th>
                <th>Email</th>
                <th>Display Name</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingId === user.id;
                const locationName =
                  user.locationId === null || user.locationId === undefined
                    ? 'No location'
                    : locationNameById.get(user.locationId) ?? `Location #${user.locationId}`;

                return (
                  <tr key={user.id}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        aria-label={`Select user ${user.displayName}`}
                        disabled={isMutating || isBulkAssigning}
                      />
                    </td>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            type="email"
                            className="edit-input"
                            value={editUserForm.email}
                            onChange={(event) =>
                              setEditUserForm((previous) => ({ ...previous, email: event.target.value }))
                            }
                            disabled={isMutating}
                            aria-label={`Edit email for ${user.displayName}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={editUserForm.displayName}
                            onChange={(event) =>
                              setEditUserForm((previous) => ({ ...previous, displayName: event.target.value }))
                            }
                            disabled={isMutating}
                            aria-label={`Edit display name for ${user.displayName}`}
                          />
                        </td>
                        <td>
                          <select
                            className="edit-input"
                            value={editUserForm.locationId ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              setEditUserForm((previous) => ({
                                ...previous,
                                locationId: value ? Number(value) : null
                              }));
                            }}
                            disabled={isMutating}
                            aria-label={`Edit location for ${user.displayName}`}
                          >
                            <option value="">No location</option>
                            {locations.map((location) => (
                              <option key={location.id} value={location.id}>
                                {location.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="password"
                            className="edit-input"
                            value={editUserForm.password}
                            onChange={(event) =>
                              setEditUserForm((previous) => ({ ...previous, password: event.target.value }))
                            }
                            placeholder="New password (optional)"
                            disabled={isMutating}
                            aria-label={`Reset password for ${user.displayName}`}
                          />
                        </td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="primary"
                              onClick={() => void handleSaveEdit(user.id)}
                              disabled={isMutating || isBulkAssigning}
                            >
                              Save
                            </button>
                            <button type="button" onClick={cancelEditing} disabled={isMutating || isBulkAssigning}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.email}</td>
                        <td>{user.displayName}</td>
                        <td>{locationName}</td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              onClick={() => startEditing(user)}
                              disabled={isMutating || isBulkAssigning}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => void handleDelete(user)}
                              disabled={isMutating || isBulkAssigning || currentUser?.id === user.id}
                              title={currentUser?.id === user.id ? 'You cannot delete your own user account.' : undefined}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className={`bulk-toolbar${selectedCount > 0 ? ' visible' : ''}`}>
        <span className="bulk-toolbar-count">
          {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
        </span>
        <span className="bulk-toolbar-divider" aria-hidden="true" />
        <select
          value={bulkLocationValue}
          onChange={(event) => setBulkLocationValue(event.target.value)}
          disabled={isBulkAssigning}
          aria-label="Choose location for selected users"
        >
          <option value="">Select a location</option>
          <option value="none">No location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="primary"
          onClick={() => void handleBulkAssign()}
          disabled={!bulkLocationValue || isBulkAssigning}
        >
          {isBulkAssigning ? 'Applying...' : 'Apply'}
        </button>
        <button
          type="button"
          className="btn-cancel"
          onClick={clearSelection}
          disabled={isBulkAssigning}
        >
          Clear
        </button>
      </div>
    </section>
  );
}
