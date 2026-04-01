import { Fragment } from 'react';
import { useUsersPage } from '../../hooks/useUsersPage';

export default function UsersPage(): JSX.Element {
  const {
    currentUser,
    users,
    filteredUsers,
    locations,
    searchQuery,
    setSearchQuery,
    filterLocationId,
    setFilterLocationId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newUserForm,
    setNewUserForm,
    editingId,
    editUserForm,
    setEditUserForm,
    scheduleForm,
    setScheduleForm,
    scheduleLoading,
    loading,
    isMutating,
    isBulkAssigning,
    error,
    success,
    selectedUserIds,
    bulkLocationValue,
    setBulkLocationValue,
    selectionAnnouncement,
    selectAllCheckboxRef,
    locationNameById,
    selectedCount,
    allSelected,
    toggleUserSelection,
    clearSelection,
    toggleSelectAll,
    handleBulkAssign,
    handleCreateUser,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleDelete
  } = useUsersPage();

  return (
    <section className="admin-management">
      <h2>User Management</h2>

      <div aria-live="polite">
        <p className="sr-only">{selectionAnnouncement}</p>
        {success ? <p className="admin-alert success">{success}</p> : null}
        {error ? <p className="admin-alert error">{error}</p> : null}
      </div>

      <div className="users-toolbar">
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={isMutating}
        >
          Create User
        </button>
        <input
          type="text"
          className="users-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name..."
          aria-label="Search users by name"
        />
        <select
          className="users-location-filter"
          value={filterLocationId ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setFilterLocationId(value ? Number(value) : null);
          }}
          aria-label="Filter by location"
        >
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="message">Loading users...</p> : null}

      {!loading && users.length === 0 ? <p className="empty-state">No users found</p> : null}

      {!loading && users.length > 0 ? (
        <>
          {filteredUsers.length === 0 ? (
            <p className="empty-state">No users match your search criteria</p>
          ) : (
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
                  {filteredUsers.map((user) => {
                    const isEditing = editingId === user.id;
                    const locationName =
                      user.locationId === null || user.locationId === undefined
                        ? 'No location'
                        : locationNameById.get(user.locationId) ?? `Location #${user.locationId}`;

                    return (
                      <Fragment key={user.id}>
                        <tr>
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
                                  value={editUserForm.firstName}
                                  onChange={(event) =>
                                    setEditUserForm((previous) => ({ ...previous, firstName: event.target.value }))
                                  }
                                  disabled={isMutating}
                                  aria-label={`Edit first name for ${user.displayName}`}
                                />
                                <input
                                  type="text"
                                  className="edit-input"
                                  value={editUserForm.lastName}
                                  onChange={(event) =>
                                    setEditUserForm((previous) => ({ ...previous, lastName: event.target.value }))
                                  }
                                  disabled={isMutating}
                                  aria-label={`Edit last name for ${user.displayName}`}
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
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    disabled={isMutating || isBulkAssigning}
                                  >
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
                                    className="icon-btn"
                                    onClick={() => void startEditing(user)}
                                    disabled={isMutating || isBulkAssigning}
                                    title="Edit user"
                                    aria-label={`Edit ${user.displayName}`}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn danger"
                                    onClick={() => void handleDelete(user)}
                                    disabled={isMutating || isBulkAssigning || currentUser?.id === user.id}
                                    title={currentUser?.id === user.id ? 'You cannot delete your own account' : 'Delete user'}
                                    aria-label={`Delete ${user.displayName}`}
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
                        {isEditing ? (
                          <tr className="schedule-expansion-row">
                            <td colSpan={5}>
                              <div className="schedule-panel">
                                <h4 className="schedule-panel-title">Work Schedule</h4>
                                {scheduleLoading ? (
                                  <p className="message">Loading schedule...</p>
                                ) : (
                                  <>
                                    <div className="schedule-days-group">
                                      {(
                                        [
                                          'monday',
                                          'tuesday',
                                          'wednesday',
                                          'thursday',
                                          'friday',
                                          'saturday',
                                          'sunday'
                                        ] as const
                                      ).map((day) => (
                                        <label key={day} className={`day-toggle ${scheduleForm[day] ? 'active' : ''}`}>
                                          <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={scheduleForm[day]}
                                            onChange={() =>
                                              setScheduleForm((previous) => ({ ...previous, [day]: !previous[day] }))
                                            }
                                            disabled={isMutating}
                                          />
                                          {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                                        </label>
                                      ))}
                                    </div>
                                    <div className="schedule-settings-grid">
                                      <div className="setting-item">
                                        <label htmlFor={`hours-${user.id}`}>Hours per week</label>
                                        <input
                                          id={`hours-${user.id}`}
                                          type="number"
                                          className="edit-input"
                                          min="0"
                                          step="0.5"
                                          value={scheduleForm.hoursPerWeek}
                                          onChange={(event) =>
                                            setScheduleForm((previous) => ({
                                              ...previous,
                                              hoursPerWeek: event.target.value
                                            }))
                                          }
                                          disabled={isMutating}
                                          placeholder="e.g. 40"
                                        />
                                      </div>
                                      <div className="setting-item checkbox-setting">
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={scheduleForm.ignoreWeekends}
                                            onChange={(event) =>
                                              setScheduleForm((previous) => ({
                                                ...previous,
                                                ignoreWeekends: event.target.checked
                                              }))
                                            }
                                            disabled={isMutating}
                                          />
                                          Ignore weekends
                                        </label>
                                      </div>
                                      <div className="setting-item checkbox-setting">
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={scheduleForm.ignorePublicHolidays}
                                            onChange={(event) =>
                                              setScheduleForm((previous) => ({
                                                ...previous,
                                                ignorePublicHolidays: event.target.checked
                                              }))
                                            }
                                            disabled={isMutating}
                                          />
                                          Ignore public holidays
                                        </label>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
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

      {isCreateModalOpen ? (
        <div
          className="teams-modal-overlay"
          role="presentation"
          onClick={() => !isMutating && setIsCreateModalOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isMutating) {
              setIsCreateModalOpen(false);
            }
          }}
        >
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create user"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Create User</h2>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateUser(event);
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(event) =>
                    setNewUserForm((previous) => ({ ...previous, email: event.target.value }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>
              <label>
                First name
                <input
                  type="text"
                  value={newUserForm.firstName}
                  onChange={(event) =>
                    setNewUserForm((previous) => ({ ...previous, firstName: event.target.value }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  value={newUserForm.lastName}
                  onChange={(event) =>
                    setNewUserForm((previous) => ({ ...previous, lastName: event.target.value }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(event) =>
                    setNewUserForm((previous) => ({ ...previous, password: event.target.value }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>
              <label>
                Location
                <select
                  value={newUserForm.locationId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNewUserForm((previous) => ({
                      ...previous,
                      locationId: value ? Number(value) : null
                    }));
                  }}
                  disabled={isMutating}
                >
                  <option value="">No location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
              {error ? <p className="message error">{error}</p> : null}
              <div className="teams-modal__actions">
                <button
                  type="button"
                  className="teams-action-btn teams-action-btn--reject"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewUserForm({ email: '', firstName: '', lastName: '', password: '', locationId: null });
                  }}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isMutating}>
                  {isMutating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
