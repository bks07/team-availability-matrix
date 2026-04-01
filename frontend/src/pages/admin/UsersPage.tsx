import { useUsersPage } from '../../hooks/useUsersPage';

const SCHEDULE_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export default function UsersPage(): JSX.Element {
  const {
    currentUser,
    users,
    filteredUsers,
    workSchedules,
    locations,
    searchQuery,
    setSearchQuery,
    filterLocationId,
    setFilterLocationId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newUserForm,
    setNewUserForm,
    editModalUserId,
    passwordModalUserId,
    editUserForm,
    setEditUserForm,
    passwordForm,
    setPasswordForm,
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
    openEditModal,
    closeEditModal,
    openPasswordModal,
    closePasswordModal,
    handleSaveEdit,
    handleChangePassword,
    handleDelete
  } = useUsersPage();

  const editModalUser =
    editModalUserId !== null ? users.find((user) => user.id === editModalUserId) ?? null : null;
  const passwordModalUser =
    passwordModalUserId !== null
      ? users.find((user) => user.id === passwordModalUserId) ?? null
      : null;

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
                    <th>Schedule</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const userSchedule = workSchedules.get(user.id);
                    const hoursLabel = userSchedule?.hoursPerWeek != null ? `${userSchedule.hoursPerWeek} h/w` : '—';
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
                        <td>{user.email}</td>
                        <td>{user.displayName}</td>
                        <td>{locationName}</td>
                        <td className="schedule-cell">
                          <div className="schedule-dots">
                            {SCHEDULE_DAYS.map((day, index) => {
                              const active = userSchedule?.[day] ?? index < 5;
                              const isWeekend = index >= 5;

                              return (
                                <span
                                  key={day}
                                  className={`schedule-dot${active ? (isWeekend ? ' weekend' : ' workday') : ' inactive'}`}
                                  title={day.charAt(0).toUpperCase() + day.slice(1)}
                                />
                              );
                            })}
                          </div>
                          <div className="schedule-hours">{hoursLabel}</div>
                        </td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => void openEditModal(user)}
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
                              className="icon-btn"
                              onClick={() => openPasswordModal(user.id)}
                              disabled={isMutating || isBulkAssigning}
                              title="Change password"
                              aria-label={`Change password for ${user.displayName}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="5" cy="5" r="3.5" />
                                <path d="M7.5 7.5L14 14" />
                                <path d="M11 11l2 -2" />
                                <path d="M13 13l2 -2" />
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
                      </tr>
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
                    setNewUserForm({
                      title: '',
                      email: '',
                      firstName: '',
                      middleName: '',
                      lastName: '',
                      password: '',
                      locationId: null
                    });
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

      {editModalUserId !== null ? (
        <div
          className="teams-modal-overlay"
          role="presentation"
          onClick={() => !isMutating && closeEditModal()}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isMutating) {
              closeEditModal();
            }
          }}
        >
          <section
            className="teams-modal teams-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-label="Edit user"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Edit User — {editModalUser?.displayName ?? 'User'}</h2>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (editModalUserId !== null) {
                  void handleSaveEdit(editModalUserId);
                }
              }}
            >
              <div className="modal-form-grid">
                <label>
                  Title
                  <input
                    type="text"
                    value={editUserForm.title}
                    onChange={(event) =>
                      setEditUserForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    disabled={isMutating}
                  />
                </label>
                <label>
                  First Name
                  <input
                    type="text"
                    value={editUserForm.firstName}
                    onChange={(event) =>
                      setEditUserForm((previous) => ({ ...previous, firstName: event.target.value }))
                    }
                    required
                    disabled={isMutating}
                  />
                </label>
                <label>
                  Middle Name
                  <input
                    type="text"
                    value={editUserForm.middleName}
                    onChange={(event) =>
                      setEditUserForm((previous) => ({ ...previous, middleName: event.target.value }))
                    }
                    disabled={isMutating}
                  />
                </label>
                <label>
                  Last Name
                  <input
                    type="text"
                    value={editUserForm.lastName}
                    onChange={(event) =>
                      setEditUserForm((previous) => ({ ...previous, lastName: event.target.value }))
                    }
                    required
                    disabled={isMutating}
                  />
                </label>
              </div>

              <label>
                Email
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(event) =>
                    setEditUserForm((previous) => ({ ...previous, email: event.target.value }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>

              <label>
                Location
                <select
                  value={editUserForm.locationId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEditUserForm((previous) => ({
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

              <h3 className="schedule-modal-title">Work Schedule</h3>
              {scheduleLoading ? (
                <p className="message">Loading schedule...</p>
              ) : (
                <>
                  <div className="schedule-days-group">
                    {(
                      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
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
                      <label htmlFor="edit-user-hours">Hours per week</label>
                      <input
                        id="edit-user-hours"
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

              <div className="teams-modal__actions">
                <button
                  type="button"
                  className="teams-action-btn teams-action-btn--reject"
                  onClick={closeEditModal}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isMutating}>
                  {isMutating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {passwordModalUserId !== null ? (
        <div
          className="teams-modal-overlay"
          role="presentation"
          onClick={() => !isMutating && closePasswordModal()}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isMutating) {
              closePasswordModal();
            }
          }}
        >
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Change password"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Change Password</h2>
            <p className="password-modal-user-info">
              {passwordModalUser?.displayName ?? 'Unknown user'} - {passwordModalUser?.email ?? ''}
            </p>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleChangePassword();
              }}
            >
              <label>
                New Password
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({
                      ...previous,
                      password: event.target.value
                    }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({
                      ...previous,
                      confirmPassword: event.target.value
                    }))
                  }
                  required
                  disabled={isMutating}
                />
              </label>
              <div className="teams-modal__actions">
                <button
                  type="button"
                  className="teams-action-btn teams-action-btn--reject"
                  onClick={closePasswordModal}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isMutating}>
                  {isMutating ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
