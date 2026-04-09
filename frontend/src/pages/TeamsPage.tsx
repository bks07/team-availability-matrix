import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Team, TeamInvitation } from '../lib/api.models';
import { teamService } from '../services/team.service';

type SortField = 'name' | 'memberCount' | 'ownerName' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function comparePrimitive(a: string | number, b: string | number, dir: 'asc' | 'desc'): number {
  if (typeof a === 'string' && typeof b === 'string') {
    const cmp = a.localeCompare(b, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  }
  const diff = (a as number) - (b as number);
  return dir === 'asc' ? diff : -diff;
}

export default function TeamsPage(): JSX.Element {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Invitation actions
  const [pendingInvitationId, setPendingInvitationId] = useState<number | null>(null);

  // Confirmation modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'leave';
    teamId: number;
    teamName: string;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Invite modal
  const [inviteTeamId, setInviteTeamId] = useState<number | null>(null);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<{ id: number; displayName: string; email: string }[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // Sorting
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const liveRegionRef = useRef<HTMLParagraphElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [teamsData, invitationsData] = await Promise.all([
        teamService.getMyTeams(),
        teamService.getMyInvitations(),
      ]);
      setTeams(teamsData);
      setInvitations(invitationsData.filter((item) => item.status.toLowerCase() === 'pending'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load teams.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Filtered + sorted teams
  const processedTeams = useMemo(() => {
    let result = [...teams];

    // Filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.ownerName.toLowerCase().includes(q),
      );
    }

    // Sort: favorites first, then by sort field or alphabetic
    result.sort((a, b) => {
      // Favorites always first
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      // Active sort column
      if (sort.field && sort.direction) {
        let valA: string | number;
        let valB: string | number;
        switch (sort.field) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'memberCount':
            valA = a.memberCount;
            valB = b.memberCount;
            break;
          case 'ownerName':
            valA = a.ownerName.toLowerCase();
            valB = b.ownerName.toLowerCase();
            break;
          case 'createdAt':
            valA = a.createdAt;
            valB = b.createdAt;
            break;
        }
        const cmp = comparePrimitive(valA, valB, sort.direction);
        if (cmp !== 0) return cmp;
      }

      // Default: alphabetic by name
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return result;
  }, [teams, debouncedSearch, sort]);

  // Announce filtered count to screen readers
  useEffect(() => {
    if (debouncedSearch.trim() && liveRegionRef.current) {
      liveRegionRef.current.textContent = `${processedTeams.length} team${processedTeams.length === 1 ? '' : 's'} found`;
    } else if (liveRegionRef.current) {
      liveRegionRef.current.textContent = '';
    }
  }, [processedTeams.length, debouncedSearch]);

  const handleSort = (field: SortField) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      if (prev.direction === 'desc') return { field: null, direction: null };
      return { field, direction: 'asc' };
    });
  };

  const sortIndicator = (field: SortField): string => {
    if (sort.field !== field || !sort.direction) return '';
    return sort.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Favorite toggle
  const handleToggleFavorite = useCallback(
    async (teamId: number) => {
      const prev = teams.map((t) => ({ ...t }));
      setTeams((current) =>
        current.map((t) => (t.id === teamId ? { ...t, isFavorite: !t.isFavorite } : t)),
      );

      try {
        await teamService.toggleFavorite(teamId);
      } catch {
        setTeams(prev);
        setErrorMessage('Failed to update favorite.');
      }
    },
    [teams],
  );

  // Create modal
  const openCreateModal = () => {
    setName('');
    setDescription('');
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
  };

  const handleCreateTeam = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Team name is required.');
      return;
    }

    setIsCreating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const created = await teamService.createTeam({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      setIsCreateOpen(false);
      setSuccessMessage(`Team "${created.name}" created.`);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create team.');
    } finally {
      setIsCreating(false);
    }
  };

  // Invitation handling
  const handleInvitation = async (id: number, action: 'accept' | 'reject') => {
    setPendingInvitationId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (action === 'accept') {
        await teamService.acceptInvitation(id);
        setSuccessMessage('Invitation accepted.');
      } else {
        await teamService.rejectInvitation(id);
        setSuccessMessage('Invitation rejected.');
      }
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update invitation.');
    } finally {
      setPendingInvitationId(null);
    }
  };

  // Confirmation modal actions
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsConfirming(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (confirmAction.type === 'delete') {
        await teamService.deleteTeam(confirmAction.teamId);
        setSuccessMessage(`Team "${confirmAction.teamName}" deleted.`);
      } else {
        await teamService.leaveTeam(confirmAction.teamId);
        setSuccessMessage(`You left "${confirmAction.teamName}".`);
      }
      setConfirmAction(null);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Invite modal
  const openInviteModal = (teamId: number) => {
    setInviteTeamId(teamId);
    setInviteQuery('');
    setInviteResults([]);
  };

  const closeInviteModal = () => {
    if (isInviting) return;
    setInviteTeamId(null);
  };

  const handleInviteSearch = async (q: string) => {
    setInviteQuery(q);
    if (q.trim().length < 2) {
      setInviteResults([]);
      return;
    }
    try {
      const results = await teamService.searchUsers(q.trim());
      setInviteResults(results);
    } catch {
      setInviteResults([]);
    }
  };

  const handleInviteUser = async (userId: number) => {
    if (!inviteTeamId) return;
    setIsInviting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await teamService.inviteToTeam(inviteTeamId, userId);
      setSuccessMessage('Invitation sent.');
      closeInviteModal();
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const renderSortHeader = (label: string, field: SortField) => (
    <th
      className="sortable-header"
      onClick={() => handleSort(field)}
      role="columnheader"
      aria-sort={
        sort.field === field && sort.direction
          ? sort.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label}{sortIndicator(field)}
    </th>
  );

  return (
    <main className="teams-page">
      <header className="teams-page__header">
        <h1>My Teams</h1>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          Create Team
        </button>
      </header>

      {successMessage ? <p className="message success">{successMessage}</p> : null}
      {errorMessage ? <p className="message error">{errorMessage}</p> : null}

      {isLoading ? <p className="teams-page__loading">Loading teams...</p> : null}

      {!isLoading && invitations.length > 0 ? (
        <section className="teams-invitations" aria-label="Pending invitations">
          <h2>Pending Invitations</h2>
          <ul className="teams-invitations__list">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="teams-invitations__item">
                <div>
                  <p className="teams-invitations__team-name">{invitation.teamName}</p>
                  <p className="teams-invitations__meta">
                    Invited by {invitation.inviterName} on {formatDate(invitation.createdAt)}
                  </p>
                </div>
                <div className="teams-invitations__actions">
                  <button
                    type="button"
                    className="teams-action-btn teams-action-btn--accept"
                    disabled={pendingInvitationId === invitation.id}
                    onClick={() => void handleInvitation(invitation.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="teams-action-btn teams-action-btn--reject"
                    disabled={pendingInvitationId === invitation.id}
                    onClick={() => void handleInvitation(invitation.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isLoading && teams.length === 0 && invitations.length === 0 ? (
        <section className="teams-empty-state">
          <p>You haven't joined any teams yet</p>
          <button type="button" className="primary-button" onClick={openCreateModal}>
            Create your first team
          </button>
        </section>
      ) : null}

      {!isLoading && teams.length > 0 ? (
        <>
          {/* Search toolbar */}
          <div className="teams-toolbar" role="search">
            <div className="teams-search-wrapper">
              <input
                type="text"
                className="teams-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, or owner..."
                aria-label="Search teams"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="teams-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
            <p ref={liveRegionRef} className="sr-only" aria-live="polite" />
          </div>

          {processedTeams.length === 0 ? (
            <p className="empty-state">No teams match your search</p>
          ) : (
            <div className="matrix-wrapper">
              <table className="permission-table teams-table">
                <thead>
                  <tr>
                    <th className="teams-col-fav">Favorite</th>
                    {renderSortHeader('Name', 'name')}
                    <th>Description</th>
                    {renderSortHeader('Members', 'memberCount')}
                    {renderSortHeader('Owner', 'ownerName')}
                    {renderSortHeader('Created', 'createdAt')}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedTeams.map((team) => {
                    const role = team.myRole.toLowerCase();
                    const isOwner = role === 'owner';
                    const isAdmin = role === 'admin';

                    return (
                      <tr key={team.id}>
                        <td className="teams-col-fav">
                          <button
                            type="button"
                            className={`star-btn${team.isFavorite ? ' star-btn--active' : ''}`}
                            onClick={() => void handleToggleFavorite(team.id)}
                            aria-label={team.isFavorite ? `Unstar ${team.name}` : `Star ${team.name}`}
                            title={team.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {team.isFavorite ? '★' : '☆'}
                          </button>
                        </td>
                        <td>
                          {team.name}
                          {isAdmin ? <span className="admin-badge">Admin</span> : null}
                        </td>
                        <td className="teams-col-desc">{team.description || '—'}</td>
                        <td>{team.memberCount}</td>
                        <td className={isOwner ? 'owner-highlight' : ''}>
                          {team.ownerName}
                        </td>
                        <td>{formatDate(team.createdAt)}</td>
                        <td>
                          <div className="entity-actions">
                            {(isOwner || isAdmin) ? (
                              <>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => navigate(`/teams/${team.id}`)}
                                  title="Configure"
                                  aria-label={`Configure ${team.name}`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="8" cy="8" r="3" />
                                    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => openInviteModal(team.id)}
                                  title="Invite"
                                  aria-label={`Invite to ${team.name}`}
                                >
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 14v-1.5a3 3 0 00-3-3H4.5a3 3 0 00-3 3V14" />
                                    <circle cx="6.25" cy="4.5" r="2.5" />
                                    <path d="M13 6v4M11 8h4" />
                                  </svg>
                                </button>
                              </>
                            ) : null}
                            {isOwner ? (
                              <button
                                type="button"
                                className="icon-btn danger"
                                onClick={() => setConfirmAction({ type: 'delete', teamId: team.id, teamName: team.name })}
                                title="Delete"
                                aria-label={`Delete ${team.name}`}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                                </svg>
                              </button>
                            ) : null}
                            {!isOwner ? (
                              <button
                                type="button"
                                className="icon-btn danger"
                                onClick={() => setConfirmAction({ type: 'leave', teamId: team.id, teamName: team.name })}
                                title="Leave"
                                aria-label={`Leave ${team.name}`}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 2H13a1 1 0 011 1v10a1 1 0 01-1 1H10M6 12l-4-4 4-4M2 8h9" />
                                </svg>
                              </button>
                            ) : null}
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

      {/* Create Team Modal */}
      {isCreateOpen ? (
        <div className="teams-modal-overlay" role="presentation" onClick={closeCreateModal}>
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create team"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Create Team</h2>
            <form onSubmit={handleCreateTeam} className="teams-form">
              <label>
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  disabled={isCreating}
                />
              </label>
              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  disabled={isCreating}
                />
              </label>
              <div className="teams-modal__actions">
                <button type="button" className="teams-action-btn teams-action-btn--reject" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {/* Confirm Delete/Leave Modal */}
      {confirmAction ? (
        <div className="teams-modal-overlay" role="presentation" onClick={() => !isConfirming && setConfirmAction(null)}>
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label={confirmAction.type === 'delete' ? 'Confirm delete' : 'Confirm leave'}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{confirmAction.type === 'delete' ? 'Delete Team' : 'Leave Team'}</h2>
            <p>
              {confirmAction.type === 'delete'
                ? `Are you sure you want to delete "${confirmAction.teamName}"? This action cannot be undone.`
                : `Are you sure you want to leave "${confirmAction.teamName}"?`}
            </p>
            <div className="teams-modal__actions">
              <button
                type="button"
                className="teams-action-btn teams-action-btn--reject"
                onClick={() => setConfirmAction(null)}
                disabled={isConfirming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                onClick={() => void handleConfirmAction()}
                disabled={isConfirming}
              >
                {isConfirming ? 'Processing...' : confirmAction.type === 'delete' ? 'Delete' : 'Leave'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Invite Modal */}
      {inviteTeamId !== null ? (
        <div className="teams-modal-overlay" role="presentation" onClick={closeInviteModal}>
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Invite to team"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Invite to Team</h2>
            <label>
              Search users
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => void handleInviteSearch(e.target.value)}
                placeholder="Search by name or email..."
                disabled={isInviting}
              />
            </label>
            {inviteResults.length > 0 ? (
              <ul className="invite-results">
                {inviteResults.map((user) => (
                  <li key={user.id} className="invite-results__item">
                    <span>{user.displayName} ({user.email})</span>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => void handleInviteUser(user.id)}
                      disabled={isInviting}
                    >
                      Invite
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="teams-modal__actions">
              <button type="button" className="teams-action-btn teams-action-btn--reject" onClick={closeInviteModal}>
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
