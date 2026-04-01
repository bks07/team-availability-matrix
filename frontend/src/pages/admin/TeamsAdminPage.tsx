import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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

  return parsedDate.toLocaleDateString();
}

export default function TeamsAdminPage(): JSX.Element {
  const { currentUser } = useAuth();
  const canManageTeams = currentUser?.permissions.includes('teams.view') ?? false;

  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
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
      setShowCreateForm(false);
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
    setShowCreateForm(false);
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
      if (expandedTeamId === team.id) {
        setExpandedTeamId(null);
        setMembers([]);
        setAssignSearch('');
        setSearchResults([]);
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

  const handleToggleMembers = (teamId: number) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
      setMembers([]);
      setAssignSearch('');
      setSearchResults([]);
      return;
    }

    setExpandedTeamId(teamId);
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
    if (expandedTeamId === null) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await adminTeamService.assignUser(expandedTeamId, userId);
      await Promise.all([loadMembers(expandedTeamId), loadTeams()]);
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

  const expandedTeam = useMemo(
    () => teams.find((team) => team.id === expandedTeamId) ?? null,
    [expandedTeamId, teams]
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
          className="primary"
          onClick={() => {
            setShowCreateForm((previous) => {
              const next = !previous;
              if (!next) {
                resetForm();
              }
              return next;
            });
            setEditingTeamId(null);
            setError('');
            setSuccess('');
          }}
          disabled={isMutating}
        >
          {showCreateForm ? 'Cancel' : 'New Team'}
        </button>
      </div>

      {showCreateForm ? (
        <div className="permission-form" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label htmlFor="new-team-name">Name</label>
            <input
              id="new-team-name"
              type="text"
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              disabled={isMutating}
              placeholder="Team name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-team-description">Description (optional)</label>
            <input
              id="new-team-description"
              type="text"
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              disabled={isMutating}
              placeholder="Describe this team"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="primary" onClick={() => void handleCreate()} disabled={isMutating}>
              Create Team
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              disabled={isMutating}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <p className="message">Loading teams...</p> : null}

      {!loading && teams.length === 0 ? <p className="empty-state">No teams found</p> : null}

      {!loading && teams.length > 0 ? (
        <div className="matrix-wrapper">
          <table className="permission-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Members</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const isEditing = editingTeamId === team.id;
                const isExpanded = expandedTeamId === team.id;

                return (
                  <Fragment key={team.id}>
                    <tr>
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
                          <td>{team.memberCount}</td>
                          <td>{formatDate(team.createdAt)}</td>
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
                          <td>{team.memberCount}</td>
                          <td>{formatDate(team.createdAt)}</td>
                          <td>
                            <div className="entity-actions">
                              <button
                                type="button"
                                onClick={() => void handleToggleMembers(team.id)}
                                disabled={isMutating}
                              >
                                {isExpanded ? 'Hide Members' : 'Members'}
                              </button>
                              <button type="button" onClick={() => startEditing(team)} disabled={isMutating}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => void handleDelete(team)}
                                disabled={isMutating}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                    {isExpanded ? (
                      <tr className="schedule-expansion-row">
                        <td colSpan={5}>
                          <div className="schedule-panel">
                            <h4 className="schedule-panel-title">Members - {expandedTeam?.name ?? team.name}</h4>

                            <div className="permission-form" style={{ marginBottom: '1rem' }}>
                              <div className="form-group">
                                <label htmlFor={`search-users-${team.id}`}>Search users to assign</label>
                                <input
                                  id={`search-users-${team.id}`}
                                  type="text"
                                  value={assignSearch}
                                  onChange={(event) => setAssignSearch(event.target.value)}
                                  disabled={isMutating || membersLoading}
                                  placeholder="Type a name and search"
                                />
                              </div>
                              <div className="form-actions">
                                <button
                                  type="button"
                                  className="primary"
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
                                              className="primary"
                                              onClick={() => void handleAssign(user.id)}
                                              disabled={isMutating}
                                            >
                                              Add
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : null}
                            </div>

                            {membersLoading ? <p className="message">Loading members...</p> : null}

                            {!membersLoading && members.length === 0 ? (
                              <p className="empty-state">No members in this team.</p>
                            ) : null}

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
                                        <td>{formatDate(member.joinedAt)}</td>
                                        <td>
                                          <button
                                            type="button"
                                            className="danger"
                                            onClick={() => void handleRemove(team.id, member.userId)}
                                            disabled={isMutating}
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : null}
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
      ) : null}
    </section>
  );
}
