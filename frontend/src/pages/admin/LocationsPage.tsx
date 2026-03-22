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

function isInUseDeleteError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('409') || normalized.includes('in use') || normalized.includes('referenced');
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

  const handleDelete = async (location: Location) => {
    const confirmed = window.confirm(`Delete location \"${location.name}\"?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await deleteLocation(location.id);
      setLocations((prevLocations) => prevLocations.filter((item) => item.id !== location.id));
      if (editingId === location.id) {
        setEditingId(null);
        setEditingName('');
      }
      setSuccess('Location deleted successfully.');
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);
      if (isInUseDeleteError(message)) {
        setError('Cannot delete this location because it is in use.');
      } else {
        setError(message);
      }
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

      {loading ? <p className="message">Loading locations...</p> : null}

      {!loading && locations.length === 0 ? <p className="empty-state">No locations found</p> : null}

      {!loading && locations.length > 0 ? (
        <ul className="entity-list">
          {locations.map((location) => {
            const isEditing = editingId === location.id;

            return (
              <li key={location.id} className="entity-row">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      className="edit-input"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      disabled={isMutating}
                      aria-label={`Edit ${location.name}`}
                    />
                    <div className="entity-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => void handleSaveEdit(location.id)}
                        disabled={isMutating}
                      >
                        Save
                      </button>
                      <button type="button" onClick={cancelEditing} disabled={isMutating}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="entity-name">{location.name}</span>
                    <div className="entity-actions">
                      <button type="button" onClick={() => startEditing(location)} disabled={isMutating}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => void handleDelete(location)}
                        disabled={isMutating}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
