import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Location, PublicHoliday } from '../../lib/api.models';
import { getLocations } from '../../services/location.service';
import {
  createPublicHoliday,
  deletePublicHoliday,
  getPublicHolidays,
  updatePublicHoliday
} from '../../services/public-holiday.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function formatHolidayDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

export default function HolidaysPage(): JSX.Element {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null);

  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocationId, setNewLocationId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');
  const [editLocationId, setEditLocationId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const locationNameById = useMemo(() => {
    return new Map(locations.map((location) => [location.id, location.name]));
  }, [locations]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        const loadedLocations = await getLocations();
        setLocations(loadedLocations);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadHolidaysByFilter = async () => {
      setLoading(true);
      setError('');

      try {
        const loaded = await getPublicHolidays(filterLocationId ?? undefined);
        setHolidays(loaded);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadHolidaysByFilter();
  }, [filterLocationId]);

  const refreshHolidays = async () => {
    const loaded = await getPublicHolidays(filterLocationId ?? undefined);
    setHolidays(loaded);
  };

  const handleAddHoliday = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newName.trim();
    if (!newDate.trim()) {
      setError('Holiday date is required.');
      setSuccess('');
      return;
    }

    if (!name) {
      setError('Holiday name is required.');
      setSuccess('');
      return;
    }

    if (newLocationId === null) {
      setError('Location is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await createPublicHoliday(newDate, name, newLocationId);
      await refreshHolidays();
      setNewDate('');
      setNewName('');
      setNewLocationId(null);
      setSuccess('Public holiday created successfully.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (holiday: PublicHoliday) => {
    setEditingId(holiday.id);
    setEditDate(holiday.holidayDate);
    setEditName(holiday.name);
    setEditLocationId(holiday.locationId);
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate('');
    setEditName('');
    setEditLocationId(null);
  };

  const handleSaveEdit = async (id: number) => {
    const name = editName.trim();

    if (!editDate.trim()) {
      setError('Holiday date is required.');
      setSuccess('');
      return;
    }

    if (!name) {
      setError('Holiday name is required.');
      setSuccess('');
      return;
    }

    if (editLocationId === null) {
      setError('Location is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await updatePublicHoliday(id, editDate, name, editLocationId);
      await refreshHolidays();
      setEditingId(null);
      setEditDate('');
      setEditName('');
      setEditLocationId(null);
      setSuccess('Public holiday updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (holiday: PublicHoliday) => {
    const confirmed = window.confirm(`Delete public holiday "${holiday.name}"?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await deletePublicHoliday(holiday.id);
      await refreshHolidays();

      if (editingId === holiday.id) {
        cancelEditing();
      }

      setSuccess('Public holiday deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="admin-management">
      <h2>Public Holiday Management</h2>

      <div aria-live="polite">
        {success ? <p className="admin-alert success">{success}</p> : null}
        {error ? <p className="admin-alert error">{error}</p> : null}
      </div>

      <form className="add-form" onSubmit={handleAddHoliday}>
        <input
          type="date"
          value={newDate}
          onChange={(event) => setNewDate(event.target.value)}
          disabled={isMutating}
          aria-label="Holiday date"
        />
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Holiday name"
          disabled={isMutating}
          aria-label="Holiday name"
        />
        <select
          value={newLocationId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setNewLocationId(value ? Number(value) : null);
          }}
          disabled={isMutating}
          aria-label="Holiday location"
        >
          <option value="">Select location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <button type="submit" className="primary" disabled={isMutating}>
          Add
        </button>
      </form>

      <div className="add-form" style={{ marginBottom: '1rem' }}>
        <select
          value={filterLocationId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setFilterLocationId(value ? Number(value) : null);
          }}
          disabled={loading || isMutating}
          aria-label="Filter by location"
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="message">Loading public holidays...</p> : null}

      {!loading && holidays.length === 0 ? <p className="empty-state">No public holidays found</p> : null}

      {!loading && holidays.length > 0 ? (
        <ul className="entity-list">
          {holidays.map((holiday) => {
            const isEditing = editingId === holiday.id;
            const locationName = locationNameById.get(holiday.locationId) ?? `Location #${holiday.locationId}`;

            return (
              <li key={holiday.id} className="entity-row">
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      className="edit-input"
                      value={editDate}
                      onChange={(event) => setEditDate(event.target.value)}
                      disabled={isMutating}
                      aria-label={`Edit date for ${holiday.name}`}
                    />
                    <input
                      type="text"
                      className="edit-input"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      disabled={isMutating}
                      aria-label={`Edit name for ${holiday.name}`}
                    />
                    <select
                      className="edit-input"
                      value={editLocationId ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEditLocationId(value ? Number(value) : null);
                      }}
                      disabled={isMutating}
                      aria-label={`Edit location for ${holiday.name}`}
                    >
                      <option value="">Select location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    <div className="entity-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => void handleSaveEdit(holiday.id)}
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
                    <span className="entity-name">
                      {formatHolidayDate(holiday.holidayDate)} - {holiday.name} ({locationName})
                    </span>
                    <div className="entity-actions">
                      <button type="button" onClick={() => startEditing(holiday)} disabled={isMutating}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => void handleDelete(holiday)}
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
