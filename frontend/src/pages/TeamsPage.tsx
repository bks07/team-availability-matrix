import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Team, TeamInvitation } from '../lib/api.models';
import { teamService } from '../services/team.service';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function toRoleClass(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (normalized === 'owner') {
    return 'owner';
  }
  if (normalized === 'admin') {
    return 'admin';
  }
  return 'member';
}

export default function TeamsPage(): JSX.Element {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingInvitationId, setPendingInvitationId] = useState<number | null>(null);

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

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) {
      return;
    }
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

      {!isLoading && teams.length === 0 ? (
        <section className="teams-empty-state">
          <p>You haven't joined any teams yet</p>
          <button type="button" className="primary-button" onClick={openCreateModal}>
            Create your first team
          </button>
        </section>
      ) : null}

      {!isLoading && teams.length > 0 ? (
        <section className="teams-grid" aria-label="Teams list">
          {teams.map((team) => (
            <article
              key={team.id}
              className="team-card"
              onClick={() => navigate(`/teams/${team.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/teams/${team.id}`);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <h2 className="team-card__name">{team.name}</h2>
              <p className="team-card__description">{team.description || 'No description provided.'}</p>
              <div className="team-card__footer">
                <span className="team-card__member-count">{team.memberCount} members</span>
                <span className={`team-role-badge team-role-badge--${toRoleClass(team.myRole)}`}>
                  {team.myRole}
                </span>
              </div>
            </article>
          ))}
        </section>
      ) : null}

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
    </main>
  );
}
