import { useHolidaysPage } from '../../hooks/useHolidaysPage';

export default function HolidaysPage(): JSX.Element {
  const {
    holidays,
    locations,
    filterLocationId,
    setFilterLocationId,
    newDate,
    setNewDate,
    newName,
    setNewName,
    newLocationId,
    setNewLocationId,
    editingId,
    editDate,
    setEditDate,
    editName,
    setEditName,
    editLocationId,
    setEditLocationId,
    loading,
    error,
    success,
    isMutating,
    locationNameById,
    handleAddHoliday,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleDelete,
    formatHolidayDate
  } = useHolidaysPage();

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
