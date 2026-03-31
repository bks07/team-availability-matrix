import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import type { TeamDetail, TeamMember, UserSearchResult } from '../lib/api.models';
import { getInitials } from '../lib/name.utils';
import { teamService } from '../services/team.service';

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function getNamePartsFromDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
  return { firstName, lastName };
}

function formatJoinedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function memberRoleClass(role: string): string {
  const normalized = normalizeRole(role);
  if (normalized === 'owner') {
    return 'owner';
  }
  if (normalized === 'admin') {
    return 'admin';
  }
  return 'member';
}

export default function TeamDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const teamId = Number(id);
  const hasValidTeamId = Number.isInteger(teamId) && teamId > 0;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [debouncedInviteQuery, setDebouncedInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<UserSearchResult[]>([]);
  const [inviteError, setInviteError] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState<number | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);

  const loadTeam = async () => {
    if (!hasValidTeamId) {
      setErrorMessage('Invalid team id.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const detail = await teamService.getTeamDetail(teamId);
      setTeam(detail);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load team details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeam();
  }, [teamId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedInviteQuery(inviteQuery.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [inviteQuery]);

  useEffect(() => {
    if (!isInviteOpen) {
      return;
    }

    if (debouncedInviteQuery.length < 2) {
      setInviteResults([]);
      setInviteError('');
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      setIsSearchingUsers(true);
      setInviteError('');

      try {
        const users = await teamService.searchUsers(debouncedInviteQuery);
        if (cancelled) {
          return;
        }

        const existingIds = new Set((team?.members ?? []).map((member) => member.userId));
        setInviteResults(users.filter((user) => !existingIds.has(user.id)));
      } catch (error) {
        if (!cancelled) {
          setInviteError(error instanceof Error ? error.message : 'Failed to search users.');
        }
      } finally {
        if (!cancelled) {
          setIsSearchingUsers(false);
        }
      }
    };

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedInviteQuery, isInviteOpen, team?.members]);

  const myMember = useMemo(() => {
    if (!currentUser || !team) {
      return null;
    }

    return team.members.find((member) => member.userId === currentUser.id) ?? null;
  }, [currentUser, team]);

  const myRole = normalizeRole(myMember?.role ?? '');
  const isOwner = myRole === 'owner';
  const canManage = isOwner || myRole === 'admin';

  const canShowActionsForMember = (member: TeamMember): boolean => {
    if (!currentUser) {
      return false;
    }

    if (isOwner) {
      return member.userId !== currentUser.id;
    }

    return myRole === 'admin' && normalizeRole(member.role) === 'member' && member.userId !== currentUser.id;
  };

  const openEditModal = () => {
    if (!team) {
      return;
    }

    setEditName(team.name);
    setEditDescription(team.description ?? '');
    setIsEditOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (!team) {
      return;
    }

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setErrorMessage('Team name is required.');
      return;
    }

    setIsMutating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await teamService.updateTeam(team.id, {
        name: trimmedName,
        description: editDescription.trim() || undefined,
      });
      setSuccessMessage('Team updated.');
      setIsEditOpen(false);
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update team.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) {
      return;
    }

    setIsMutating(true);
    setErrorMessage('');

    try {
      await teamService.deleteTeam(team.id);
      navigate('/teams');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete team.');
      setIsMutating(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) {
      return;
    }

    setIsMutating(true);
    setErrorMessage('');

    try {
      await teamService.leaveTeam(team.id);
      navigate('/teams');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to leave team.');
      setIsMutating(false);
    }
  };

  const handleInvite = async (userId: number) => {
    if (!team) {
      return;
    }

    setInvitingUserId(userId);
    setInviteError('');
    setErrorMessage('');

    try {
      await teamService.inviteToTeam(team.id, userId);
      setSuccessMessage('Invitation sent.');
      setIsInviteOpen(false);
      setInviteQuery('');
      setDebouncedInviteQuery('');
      setInviteResults([]);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Failed to invite user.');
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleUpdateMemberRole = async (userId: number, role: 'admin' | 'member') => {
    if (!team) {
      return;
    }

    setIsMutating(true);
    setOpenMenuUserId(null);
    setErrorMessage('');

    try {
      await teamService.updateMemberRole(team.id, userId, role);
      setSuccessMessage('Member role updated.');
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update role.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!team) {
      return;
    }

    setIsMutating(true);
    setOpenMenuUserId(null);
    setErrorMessage('');

    try {
      await teamService.removeMember(team.id, userId);
      setSuccessMessage('Member removed.');
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to remove member.');
    } finally {
      setIsMutating(false);
    }
  };

  const openTransferModal = (userId: number) => {
    setTransferUserId(userId);
    setIsTransferOpen(true);
    setOpenMenuUserId(null);
  };

  const handleTransferOwnership = async () => {
    if (!team || transferUserId == null) {
      return;
    }

    setIsMutating(true);
    setErrorMessage('');

    try {
      await teamService.transferOwnership(team.id, transferUserId);
      setSuccessMessage('Ownership transferred.');
      setIsTransferOpen(false);
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to transfer ownership.');
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="team-detail-page">
        <p>Loading team...</p>
      </main>
    );
  }

  if (!team || !hasValidTeamId) {
    return (
      <main className="team-detail-page">
        <Link to="/teams" className="team-back-link">
          {'<- Back to Teams'}
        </Link>
        {errorMessage ? <p className="message error">{errorMessage}</p> : <p className="message error">Team not found.</p>}
      </main>
    );
  }

  return (
    <main className="team-detail-page">
      <Link to="/teams" className="team-back-link">
        {'<- Back to Teams'}
      </Link>

      {successMessage ? <p className="message success">{successMessage}</p> : null}
      {errorMessage ? <p className="message error">{errorMessage}</p> : null}

      <section className="team-detail-header-card">
        <div>
          <h1>{team.name}</h1>
          <p>{team.description || 'No description provided.'}</p>
        </div>

        <div className="team-detail-header-actions">
          {canManage ? (
            <button type="button" className="primary-button" onClick={openEditModal} disabled={isMutating}>
              Edit
            </button>
          ) : null}

          {isOwner ? (
            <button
              type="button"
              className="danger-button"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isMutating}
            >
              Delete
            </button>
          ) : (
            <button type="button" className="teams-action-btn teams-action-btn--reject" onClick={() => void handleLeaveTeam()} disabled={isMutating}>
              Leave
            </button>
          )}
        </div>
      </section>

      <section className="team-members-section">
        <header className="team-members-header">
          <h2>Members</h2>
          {canManage ? (
            <button type="button" className="primary-button" onClick={() => setIsInviteOpen(true)} disabled={isMutating}>
              Invite Member
            </button>
          ) : null}
        </header>

        <div className="team-members-card">
          <ul className="team-members-list">
            {team.members.map((member) => {
              const memberRole = normalizeRole(member.role);
              const showActions = canShowActionsForMember(member);
              const isMenuOpen = openMenuUserId === member.userId;

              return (
                <li key={member.userId} className="team-member-row">
                  <div className="team-member-main">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.displayName} className="team-member-avatar" />
                    ) : (
                      <div className="team-member-avatar team-member-avatar--fallback">{getInitials(getNamePartsFromDisplayName(member.displayName)) || '?'}</div>
                    )}

                    <div className="team-member-text">
                      <p className="team-member-name">{member.displayName}</p>
                      <p className="team-member-email">{member.email}</p>
                      <p className="team-member-joined">Joined {formatJoinedAt(member.joinedAt)}</p>
                    </div>
                  </div>

                  <div className="team-member-side">
                    <span className={`team-role-badge team-role-badge--${memberRoleClass(member.role)}`}>
                      {member.role}
                    </span>

                    {showActions ? (
                      <div className="team-member-menu-wrap">
                        <button
                          type="button"
                          className="team-menu-trigger"
                          onClick={() => setOpenMenuUserId(isMenuOpen ? null : member.userId)}
                          aria-label={`Open actions for ${member.displayName}`}
                        >
                          ⋮
                        </button>

                        {isMenuOpen ? (
                          <div className="team-member-menu">
                            {isOwner && memberRole === 'member' ? (
                              <button
                                type="button"
                                onClick={() => void handleUpdateMemberRole(member.userId, 'admin')}
                                disabled={isMutating}
                              >
                                Promote to Admin
                              </button>
                            ) : null}

                            {isOwner && memberRole === 'admin' ? (
                              <button
                                type="button"
                                onClick={() => void handleUpdateMemberRole(member.userId, 'member')}
                                disabled={isMutating}
                              >
                                Demote to Member
                              </button>
                            ) : null}

                            {isOwner ? (
                              <button type="button" onClick={() => openTransferModal(member.userId)} disabled={isMutating}>
                                Transfer Ownership
                              </button>
                            ) : null}

                            <button
                              type="button"
                              className="team-member-menu__danger"
                              onClick={() => void handleRemoveMember(member.userId)}
                              disabled={isMutating}
                            >
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {isEditOpen ? (
        <div className="teams-modal-overlay" role="presentation" onClick={() => !isMutating && setIsEditOpen(false)}>
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit team"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Edit Team</h2>
            <form
              className="teams-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleUpdateTeam();
              }}
            >
              <label>
                Name
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                  disabled={isMutating}
                />
              </label>

              <label>
                Description
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  disabled={isMutating}
                />
              </label>

              <div className="teams-modal__actions">
                <button
                  type="button"
                  className="teams-action-btn teams-action-btn--reject"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isMutating}>
                  Save
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isInviteOpen ? (
        <div className="teams-modal-overlay" role="presentation" onClick={() => setIsInviteOpen(false)}>
          <section
            className="teams-modal team-invite-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Invite member"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Invite Member</h2>
            <label className="team-invite-search">
              Search users
              <input
                type="text"
                value={inviteQuery}
                onChange={(event) => setInviteQuery(event.target.value)}
                placeholder="Search by name or email"
                autoFocus
              />
            </label>

            {inviteError ? <p className="message error">{inviteError}</p> : null}

            <div className="team-invite-results">
              {debouncedInviteQuery.length < 2 ? <p>Type at least 2 characters to search.</p> : null}
              {isSearchingUsers ? <p>Searching...</p> : null}
              {!isSearchingUsers && debouncedInviteQuery.length >= 2 && inviteResults.length === 0 ? (
                <p>No users found.</p>
              ) : null}

              {!isSearchingUsers && inviteResults.length > 0 ? (
                <ul>
                  {inviteResults.map((result) => (
                    <li key={result.id}>
                      <div>
                        <p className="team-member-name">{result.displayName}</p>
                        <p className="team-member-email">{result.email}</p>
                      </div>
                      <button
                        type="button"
                        className="primary-button"
                        disabled={invitingUserId === result.id}
                        onClick={() => void handleInvite(result.id)}
                      >
                        {invitingUserId === result.id ? 'Inviting...' : 'Invite'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="teams-modal__actions">
              <button type="button" className="teams-action-btn teams-action-btn--reject" onClick={() => setIsInviteOpen(false)}>
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isTransferOpen ? (
        <div className="teams-modal-overlay" role="presentation" onClick={() => !isMutating && setIsTransferOpen(false)}>
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Transfer ownership"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Transfer Ownership</h2>
            <p className="team-transfer-hint">Select a member to become the new owner.</p>

            <label>
              New Owner
              <select
                value={transferUserId == null ? '' : String(transferUserId)}
                onChange={(event) => setTransferUserId(event.target.value ? Number(event.target.value) : null)}
                disabled={isMutating}
              >
                <option value="">Select member</option>
                {team.members
                  .filter((member) => normalizeRole(member.role) !== 'owner')
                  .map((member) => (
                    <option key={member.userId} value={String(member.userId)}>
                      {member.displayName} ({member.role})
                    </option>
                  ))}
              </select>
            </label>

            <div className="teams-modal__actions">
              <button
                type="button"
                className="teams-action-btn teams-action-btn--reject"
                onClick={() => setIsTransferOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleTransferOwnership()}
                disabled={isMutating || transferUserId == null}
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isDeleteOpen ? (
        <div className="teams-modal-overlay" role="presentation" onClick={() => !isMutating && setIsDeleteOpen(false)}>
          <section
            className="teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Delete team"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Delete Team</h2>
            <p>
              Are you sure you want to delete <strong>{team.name}</strong>?
            </p>
            <div className="teams-modal__actions">
              <button
                type="button"
                className="teams-action-btn teams-action-btn--reject"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={() => void handleDeleteTeam()} disabled={isMutating}>
                Delete
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
