import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { InvitationResponse, TeamInvitation } from '../lib/api.models';
import { teamService } from '../services/team.service';
import InvitationResponsesTab from './teams/InvitationResponsesTab';
import MyTeamsTab from './teams/MyTeamsTab';
import PendingInvitesTab from './teams/PendingInvitesTab';
import ReceivedInvitesTab from './teams/ReceivedInvitesTab';

type TabValue = 'my-teams' | 'received' | 'pending' | 'responses';

interface TabConfig {
  value: TabValue;
  label: string;
}

interface BadgeCounts {
  received: number;
  pending: number;
  responses: number;
}

const TAB_CONFIG: TabConfig[] = [
  { value: 'my-teams', label: 'My Teams' },
  { value: 'received', label: 'Received Invites' },
  { value: 'pending', label: 'Pending Invites' },
  { value: 'responses', label: 'Responses' },
];

const DEFAULT_TAB: TabValue = 'my-teams';

function isValidTab(value: string | null): value is TabValue {
  return value === 'my-teams' || value === 'received' || value === 'pending' || value === 'responses';
}

function countRecentResponses(responses: InvitationResponse[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  return responses.filter((response) => {
    const respondedAt = new Date(response.respondedAt);
    return !Number.isNaN(respondedAt.getTime()) && respondedAt >= cutoff;
  }).length;
}

function countPendingReceived(invitations: TeamInvitation[]): number {
  return invitations.filter((invitation) => invitation.status.toLowerCase() === 'pending').length;
}

export default function TeamsPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: TabValue = isValidTab(rawTab) ? rawTab : DEFAULT_TAB;

  const [focusedTab, setFocusedTab] = useState<TabValue>(activeTab);
  const [refreshKey, setRefreshKey] = useState(0);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    received: 0,
    pending: 0,
    responses: 0,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const tabRefs = useRef<Record<TabValue, HTMLButtonElement | null>>({
    'my-teams': null,
    received: null,
    pending: null,
    responses: null,
  });

  const setActiveTab = useCallback((nextTab: TabValue) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadBadgeCounts = useCallback(async () => {
    try {
      const [receivedInvitations, pendingInvitations, responses] = await Promise.all([
        teamService.getMyInvitations(),
        teamService.getSentInvitations(),
        teamService.getInvitationResponses(),
      ]);

      setBadgeCounts({
        received: countPendingReceived(receivedInvitations),
        pending: pendingInvitations.length,
        responses: countRecentResponses(responses),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load invitation counts.');
    }
  }, []);

  const handleDataChanged = useCallback(() => {
    setRefreshKey((value) => value + 1);
    void loadBadgeCounts();
  }, [loadBadgeCounts]);

  useEffect(() => {
    if (!isValidTab(rawTab)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', DEFAULT_TAB);
      setSearchParams(nextParams, { replace: true });
    }
  }, [rawTab, searchParams, setSearchParams]);

  useEffect(() => {
    setFocusedTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    void loadBadgeCounts();
  }, [loadBadgeCounts]);

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
  };

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
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
      setRefreshKey((value) => value + 1);
      await loadBadgeCounts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create team.');
    } finally {
      setIsCreating(false);
    }
  };

  const orderedTabs = useMemo(() => TAB_CONFIG.map((tab) => tab.value), []);

  const moveFocus = (current: TabValue, delta: number) => {
    const currentIndex = orderedTabs.indexOf(current);
    const nextIndex = (currentIndex + delta + orderedTabs.length) % orderedTabs.length;
    const nextTab = orderedTabs[nextIndex];
    setFocusedTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const handleTabKeyDown = (tab: TabValue, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(tab, 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(tab, -1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setFocusedTab(orderedTabs[0]);
      tabRefs.current[orderedTabs[0]]?.focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const lastTab = orderedTabs[orderedTabs.length - 1];
      setFocusedTab(lastTab);
      tabRefs.current[lastTab]?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tab);
    }
  };

  const getBadgeCount = (tab: TabValue): number => {
    if (tab === 'received') return badgeCounts.received;
    if (tab === 'pending') return badgeCounts.pending;
    if (tab === 'responses') return badgeCounts.responses;
    return 0;
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

      <div className="teams-tab-bar" role="tablist" aria-label="Team management tabs">
        {TAB_CONFIG.map((tab) => {
          const count = getBadgeCount(tab.value);
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              id={`teams-tab-${tab.value}`}
              ref={(node) => {
                tabRefs.current[tab.value] = node;
              }}
              type="button"
              role="tab"
              tabIndex={focusedTab === tab.value ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`teams-tabpanel-${tab.value}`}
              className={`teams-tab-bar__tab${isActive ? ' teams-tab-bar__tab--active' : ''}`}
              onClick={() => {
                setFocusedTab(tab.value);
                setActiveTab(tab.value);
              }}
              onKeyDown={(event) => handleTabKeyDown(tab.value, event)}
            >
              {tab.label}
              {count > 0 ? <span className="teams-tab-bar__badge">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <section
        id="teams-tabpanel-my-teams"
        role="tabpanel"
        aria-labelledby="teams-tab-my-teams"
        hidden={activeTab !== 'my-teams'}
      >
        <MyTeamsTab
          key={`my-teams-${refreshKey}`}
          onDataChanged={handleDataChanged}
          onOpenCreateModal={openCreateModal}
        />
      </section>

      <section
        id="teams-tabpanel-received"
        role="tabpanel"
        aria-labelledby="teams-tab-received"
        hidden={activeTab !== 'received'}
      >
        <ReceivedInvitesTab key={`received-${refreshKey}`} onDataChanged={handleDataChanged} />
      </section>

      <section
        id="teams-tabpanel-pending"
        role="tabpanel"
        aria-labelledby="teams-tab-pending"
        hidden={activeTab !== 'pending'}
      >
        <PendingInvitesTab key={`pending-${refreshKey}`} onDataChanged={handleDataChanged} />
      </section>

      <section
        id="teams-tabpanel-responses"
        role="tabpanel"
        aria-labelledby="teams-tab-responses"
        hidden={activeTab !== 'responses'}
      >
        <InvitationResponsesTab key={`responses-${refreshKey}`} />
      </section>

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
            <form onSubmit={(event) => void handleCreateTeam(event)} className="teams-form">
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
                <button
                  type="button"
                  className="teams-action-btn teams-action-btn--reject"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                >
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
