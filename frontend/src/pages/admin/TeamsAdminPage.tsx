import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { AdminTeam, TeamMember, UserSearchResult } from '../../lib/api.models';
import { adminTeamService } from '../../services/admin-team.service';
import { teamService } from '../../services/team.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function formatDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(parsedDate);
  const isoDate = parsedDate.toISOString().slice(0, 10);
  return `${weekday} ${isoDate}`;
}

export default function TeamsAdminPage(): JSX.Element {
  const { currentUser } = useAuth();
  const canManageTeams = currentUser?.permissions.includes('teams.view') ?? false;

  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [memberModalTeamId, setMemberModalTeamId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [assignSearch, setAssignSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminTeamService.listTeams();
      setTeams(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (teamId: number) => {
    setMembersLoading(true);
    setError('');

    try {
      const data = await adminTeamService.listMembers(teamId);
      setMembers(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManageTeams) {
      setLoading(false);
      return;
    }

    void loadTeams();
  }, [canManageTeams, loadTeams]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
  };

  function closeMemberModal() {
    setMemberModalTeamId(null);
    setMembers([]);
    setAssignSearch('');
    setSearchResults([]);
  }

  const handleCreate = async () => {
    const name = formName.trim();
    const description = formDescription.trim();

    if (!name) {
      setError('Team name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      const created = await adminTeamService.createTeam({
        name,
        description: description || undefined,
      });
      setTeams((previousTeams) => [created, ...previousTeams]);
      setIsCreateModalOpen(false);
      resetForm();
      setSuccess('Team created successfully.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (team: AdminTeam) => {
    setEditingTeamId(team.id);
    setIsCreateModalOpen(false);
    setFormName(team.name);
    setFormDescription(team.description || '');
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingTeamId(null);
    resetForm();
  };

  const handleSaveEdit = async () => {
    if (editingTeamId === null) {
      return;
    }

    const name = formName.trim();
    const description = formDescription.trim();

    if (!name) {
      setError('Team name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      const updated = await adminTeamService.updateTeam(editingTeamId, {
        name,
        description: description || undefined,
      });
      setTeams((previousTeams) =>
        previousTeams.map((team) =>
          team.id === editingTeamId ? { ...team, name: updated.name, description: updated.description } : team
        )
      );
      setEditingTeamId(null);
      resetForm();
      setSuccess('Team updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (team: AdminTeam) => {
    const confirmed = window.confirm(`Delete team "${team.name}"?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await adminTeamService.deleteTeam(team.id);
      setTeams((previousTeams) => previousTeams.filter((item) => item.id !== team.id));
      if (memberModalTeamId === team.id) {
        closeMemberModal();
      }
      if (editingTeamId === team.id) {
        cancelEditing();
      }
      setSuccess('Team deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsMutating(false);
    }
  };

  const openMemberModal = (teamId: number) => {
    setIsCreateModalOpen(false);
    setMemberModalTeamId(teamId);
    setMembers([]);
    setAssignSearch('');
    setSearchResults([]);
    void loadMembers(teamId);
  };

  const handleSearchUsers = async () => {
    const query = assignSearch.trim();

    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      const results = await teamService.searchUsers(query);
      const memberIds = new Set(members.map((member) => member.userId));
      setSearchResults(results.filter((user) => !memberIds.has(user.id)));
    } catch (searchError) {
      setError(getErrorMessage(searchError));
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async (userId: number) => {
    if (memberModalTeamId === null) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await adminTeamService.assignUser(memberModalTeamId, userId);
      await Promise.all([loadMembers(memberModalTeamId), loadTeams()]);
      setSearchResults((previousResults) => previousResults.filter((user) => user.id !== userId));
      setSuccess('User assigned to team.');
    } catch (assignError) {
      setError(getErrorMessage(assignError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemove = async (teamId: number, userId: number) => {
    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await adminTeamService.removeUser(teamId, userId);
      await Promise.all([loadMembers(teamId), loadTeams()]);
      setSuccess('User removed from team.');
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    } finally {
      setIsMutating(false);
    }
  };

  const memberModalTeam = useMemo(
    () => teams.find((team) => team.id === memberModalTeamId) ?? null,
    [memberModalTeamId, teams]
  );

  if (!canManageTeams) {
    return (
      <section className="guard-message">
        <h2>403 - Access denied</h2>
        <p>You do not have permission to manage teams.</p>
        <Link to="/admin/locations">Return to admin dashboard</Link>
      </section>
    );
  }

  return (
    <section className="admin-management">
      <h2>Team Management</h2>

      <div aria-live="polite">
        {success ? <p className="admin-alert success">{success}</p> : null}
        {error ? <p className="admin-alert error">{error}</p> : null}
      </div>

      <div className="form-actions" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            closeMemberModal();
            setIsCreateModalOpen(true);
            setEditingTeamId(null);
            resetForm();
            setError('');
            setSuccess('');
          }}
          disabled={isMutating}
        >
          Create Team
        </button>
      </div>

      {loading ? <p className="message">Loading teams...</p> : null}

      {!loading && teams.length === 0 ? <p className="empty-state">No teams found</p> : null}

      {!loading && teams.length > 0 ? (
        <div className="matrix-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th className="cell-center">Members</th>
                <th className="cell-center">Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const isEditing = editingTeamId === team.id;

                return (
                  <tr key={team.id}>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={formName}
                            onChange={(event) => setFormName(event.target.value)}
                            disabled={isMutating}
                            aria-label={`Edit name for ${team.name}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="edit-input"
                            value={formDescription}
                            onChange={(event) => setFormDescription(event.target.value)}
                            disabled={isMutating}
                            aria-label={`Edit description for ${team.name}`}
                          />
                        </td>
                        <td className="cell-mono-center">{team.memberCount}</td>
                        <td className="cell-mono-center">{formatDate(team.createdAt)}</td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="primary"
                              onClick={() => void handleSaveEdit()}
                              disabled={isMutating}
                            >
                              Save
                            </button>
                            <button type="button" onClick={cancelEditing} disabled={isMutating}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{team.name}</td>
                        <td>{team.description || '-'}</td>
                        <td className="cell-mono-center">{team.memberCount}</td>
                        <td className="cell-mono-center">{formatDate(team.createdAt)}</td>
                        <td>
                          <div className="entity-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => void openMemberModal(team.id)}
                              disabled={isMutating}
                              title={`Show members for ${team.name}`}
                              aria-label={`Show members for ${team.name}`}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <circle cx="5" cy="6" r="2" />
                                <circle cx="11" cy="6.5" r="2" />
                                <path d="M1.5 13c0-1.9 1.5-3.5 3.5-3.5S8.5 11.1 8.5 13" />
                                <path d="M7.5 13c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => startEditing(team)}
                              disabled={isMutating}
                              title={`Edit ${team.name}`}
                              aria-label={`Edit ${team.name}`}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => void handleDelete(team)}
                              disabled={isMutating}
                              title={`Delete ${team.name}`}
                              aria-label={`Delete ${team.name}`}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
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

      {isCreateModalOpen && memberModalTeamId === null ? (
        <div
          className="teams-modal-overlay"
          role="presentation"
          onClick={() => {
            if (!isMutating) {
              setIsCreateModalOpen(false);
              resetForm();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isMutating) {
              setIsCreateModalOpen(false);
              resetForm();
            }
          }}
        >
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create team"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Create Team</h2>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreate();
              }}
            >
              <label htmlFor="new-team-name">Name</label>
              <input
                id="new-team-name"
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                disabled={isMutating}
                placeholder="Team name"
              />
              <label htmlFor="new-team-description">Description (optional)</label>
              <input
                id="new-team-description"
                type="text"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                disabled={isMutating}
                placeholder="Describe this team"
              />
              <div className="teams-modal__actions">
                <button
                  type="button"
                  className="teams-action-btn teams-action-btn--reject"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
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

      {memberModalTeamId !== null ? (
        <div
          className="teams-modal-overlay"
          role="presentation"
          onClick={() => {
            if (!isMutating) {
              closeMemberModal();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isMutating) {
              closeMemberModal();
            }
          }}
        >
          <section
            className="teams-modal teams-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-label="Team members"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Members — {memberModalTeam?.name ?? 'Team'}</h2>

            <div className="member-modal-search">
              <input
                type="text"
                value={assignSearch}
                onChange={(event) => setAssignSearch(event.target.value)}
                disabled={isMutating || membersLoading}
                placeholder="Search users to assign..."
              />
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleSearchUsers()}
                disabled={isMutating || membersLoading || searching}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="matrix-wrapper">
                <table className="permission-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((user) => (
                      <tr key={user.id}>
                        <td>{user.displayName}</td>
                        <td>{user.email}</td>
                        <td>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => void handleAssign(user.id)}
                            disabled={isMutating}
                            title={`Add ${user.displayName} to ${memberModalTeam?.name ?? 'team'}`}
                            aria-label={`Add ${user.displayName} to ${memberModalTeam?.name ?? 'team'}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M8 3v10M3 8h10" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {membersLoading ? <p className="message">Loading members...</p> : null}

            {!membersLoading && members.length === 0 ? <p className="empty-state">No members in this team.</p> : null}

            {!membersLoading && members.length > 0 ? (
              <div className="matrix-wrapper">
                <table className="permission-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.userId}>
                        <td>{member.displayName}</td>
                        <td>{member.email}</td>
                        <td>{member.role}</td>
                        <td className="cell-mono-center">{formatDate(member.joinedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => void handleRemove(memberModalTeamId, member.userId)}
                            disabled={isMutating}
                            title={`Remove ${member.displayName} from ${memberModalTeam?.name ?? 'team'}`}
                            aria-label={`Remove ${member.displayName} from ${memberModalTeam?.name ?? 'team'}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
