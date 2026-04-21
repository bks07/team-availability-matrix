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
    editingId,
    editDate,
    setEditDate,
    editName,
    setEditName,
    addingLocationToId,
    addLocationId,
    setAddLocationId,
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
    handleOpenAddLocation,
    handleCancelAddLocation,
    handleAddLocation,
    handleRemoveLocation,
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
                <th>Locations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => {
                const isEditing = editingId === holiday.id;

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
                          {holiday.locationIds.length === 0 ? (
                            <span className="empty-state-inline">No locations</span>
                          ) : (
                            <ul className="location-chips">
                              {holiday.locationIds.map((locId) => {
                                const chipName = locationNameById.get(locId) ?? `Location #${locId}`;
                                return <li key={locId}>{chipName}</li>;
                              })}
                            </ul>
                          )}
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
                        <td>
                          {holiday.locationIds.length === 0 ? (
                            <span className="empty-state-inline">No locations</span>
                          ) : (
                            <ul className="location-chips">
                              {holiday.locationIds.map((locId) => {
                                const chipName = locationNameById.get(locId) ?? `Location #${locId}`;
                                return (
                                  <li key={locId}>
                                    {chipName}
                                    <button
                                      type="button"
                                      className="icon-btn"
                                      onClick={() => void handleRemoveLocation(holiday.id, locId)}
                                      disabled={isMutating}
                                      aria-label={`Remove ${chipName} from ${holiday.name}`}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3l10 10M13 3L3 13" />
                                      </svg>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleOpenAddLocation(holiday.id)}
                              disabled={isMutating}
                              title="Add location"
                              aria-label={`Add location to ${holiday.name}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 2v12M2 8h12" />
                              </svg>
                            </button>
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
                            {addingLocationToId === holiday.id ? (
                              <div className="add-form" style={{ marginTop: '0.5rem' }}>
                                <select
                                  value={addLocationId ?? ''}
                                  onChange={(event) => setAddLocationId(event.target.value ? Number(event.target.value) : null)}
                                  disabled={isMutating}
                                  aria-label="Select location to add"
                                >
                                  <option value="">Select location</option>
                                  {locations
                                    .filter((loc) => !holiday.locationIds.includes(loc.id))
                                    .map((loc) => (
                                      <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() => (addLocationId !== null ? void handleAddLocation(holiday.id, addLocationId) : undefined)}
                                  disabled={addLocationId === null || isMutating}
                                  aria-label="Assign location"
                                >
                                  Assign
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={handleCancelAddLocation}
                                  disabled={isMutating}
                                  aria-label="Cancel adding location"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : null}
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
