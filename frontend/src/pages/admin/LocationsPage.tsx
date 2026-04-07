import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Location } from '../../lib/api.models';
import { createLocation, deleteLocation, getLocations, updateLocation } from '../../services/location.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function LocationManagement(): JSX.Element {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);
      setError('');

      try {
        const items = await getLocations();
        setLocations(items);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadLocations();
  }, []);

  const handleAddLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newName.trim();
    if (!name) {
      setError('Location name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      const created = await createLocation(name);
      setLocations((prevLocations) => [created, ...prevLocations]);
      setNewName('');
      setSuccess('Location created successfully.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (location: Location) => {
    setEditingId(location.id);
    setEditingName(location.name);
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: number) => {
    const name = editingName.trim();
    if (!name) {
      setError('Location name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateLocation(id, name);
      setLocations((prevLocations) =>
        prevLocations.map((location) => (location.id === id ? updated : location))
      );
      setEditingId(null);
      setEditingName('');
      setSuccess('Location updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteClick = (location: Location) => {
    if (location.userCount > 0) {
      setDeleteTarget(location);
    } else {
      const confirmed = window.confirm(`Delete location "${location.name}"?`);
      if (confirmed) {
        void performDelete(location, false);
      }
    }
  };

  const performDelete = async (location: Location, force: boolean) => {
    setIsMutating(true);
    setError('');
    setSuccess('');
    setDeleteTarget(null);

    try {
      await deleteLocation(location.id, force);
      setLocations((prevLocations) => prevLocations.filter((item) => item.id !== location.id));
      if (editingId === location.id) {
        setEditingId(null);
        setEditingName('');
      }
      setSuccess('Location deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="admin-management">
      <h2>Location Management</h2>

      <div aria-live="polite">
        {success ? <p className="admin-alert success">{success}</p> : null}
        {error ? <p className="admin-alert error">{error}</p> : null}
      </div>

      <div className="toolbar-card">
        <form className="add-form" onSubmit={handleAddLocation}>
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Enter location name"
            disabled={isMutating}
            aria-label="Location name"
          />
          <button type="submit" className="primary" disabled={isMutating}>
            Add Location
          </button>
        </form>
      </div>

      {loading ? <p className="message">Loading locations...</p> : null}

      {!loading && locations.length === 0 ? <p className="empty-state">No locations found</p> : null}

      {!loading && locations.length > 0 ? (
        <div className="matrix-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => {
                const isEditing = editingId === location.id;

                return (
                  <tr key={location.id}>
                    <td>{location.id}</td>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            disabled={isMutating}
                            aria-label={`Edit ${location.name}`}
                          />
                        </td>
                        <td>{location.userCount}</td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => void handleSaveEdit(location.id)}
                              disabled={isMutating}
                              title="Save"
                              aria-label={`Save ${location.name}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 8.5l4 4L14 3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={cancelEditing}
                              disabled={isMutating}
                              title="Cancel"
                              aria-label="Cancel editing"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3l10 10M13 3L3 13" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{location.name}</td>
                        <td>{location.userCount}</td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => startEditing(location)}
                              disabled={isMutating}
                              title="Edit location"
                              aria-label={`Edit ${location.name}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => handleDeleteClick(location)}
                              disabled={isMutating}
                              title="Delete location"
                              aria-label={`Delete ${location.name}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                              </svg>
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

      {deleteTarget !== null ? (
        <div
          className="teams-modal-overlay"
          role="presentation"
          onClick={() => !isMutating && setDeleteTarget(null)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isMutating) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Delete Location</h2>
            <p>
              The location <strong>{deleteTarget.name}</strong> is currently assigned to{' '}
              <strong>
                {deleteTarget.userCount} user{deleteTarget.userCount === 1 ? '' : 's'}
              </strong>
              . Deleting it will remove the location assignment from these users.
            </p>
            <div className="teams-modal__actions">
              <button
                type="button"
                className="primary"
                onClick={() => void performDelete(deleteTarget, true)}
                disabled={isMutating}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isMutating}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
