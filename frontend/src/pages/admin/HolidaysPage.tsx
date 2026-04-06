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

      <div className="toolbar-card">
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

        <div className="add-form">
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
      </div>

      {loading ? <p className="message">Loading public holidays...</p> : null}

      {!loading && holidays.length === 0 ? <p className="empty-state">No public holidays found</p> : null}

      {!loading && holidays.length > 0 ? (
        <div className="matrix-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => {
                const isEditing = editingId === holiday.id;
                const locationName = locationNameById.get(holiday.locationId) ?? `Location #${holiday.locationId}`;

                return (
                  <tr key={holiday.id}>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            type="date"
                            className="edit-input"
                            value={editDate}
                            onChange={(event) => setEditDate(event.target.value)}
                            disabled={isMutating}
                            aria-label={`Edit date for ${holiday.name}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            disabled={isMutating}
                            aria-label={`Edit name for ${holiday.name}`}
                          />
                        </td>
                        <td>
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
                        </td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => void handleSaveEdit(holiday.id)}
                              disabled={isMutating}
                              title="Save"
                              aria-label={`Save ${holiday.name}`}
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
                        <td>{formatHolidayDate(holiday.holidayDate)}</td>
                        <td>{holiday.name}</td>
                        <td>{locationName}</td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => startEditing(holiday)}
                              disabled={isMutating}
                              title="Edit holiday"
                              aria-label={`Edit ${holiday.name}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => void handleDelete(holiday)}
                              disabled={isMutating}
                              title="Delete holiday"
                              aria-label={`Delete ${holiday.name}`}
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
    </section>
  );
}
