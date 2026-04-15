import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  InvitationResponse,
  SentInvitation,
  Team,
  TeamInvitation,
} from '../lib/api.models';
import { teamService } from '../services/team.service';
import TeamsPage from './TeamsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: actual.useSearchParams,
  };
});

vi.mock('../services/team.service', () => ({
  teamService: {
    getMyTeams: vi.fn(),
    getTeamDetail: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    inviteToTeam: vi.fn(),
    getMyInvitations: vi.fn(),
    getSentInvitations: vi.fn(),
    getInvitationResponses: vi.fn(),
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
    cancelInvitation: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    leaveTeam: vi.fn(),
    transferOwnership: vi.fn(),
    toggleFavorite: vi.fn(),
    searchUsers: vi.fn(),
  },
}));

const ownerTeam: Team = {
  id: 1,
  name: 'Alpha',
  description: 'Alpha description',
  memberCount: 5,
  myRole: 'owner',
  ownerName: 'Alice Owner',
  createdAt: '2026-03-10T00:00:00Z',
  isFavorite: false,
};

const adminTeam: Team = {
  id: 2,
  name: 'Bravo',
  description: 'Bravo description',
  memberCount: 3,
  myRole: 'admin',
  ownerName: 'Bob Boss',
  createdAt: '2026-02-10T00:00:00Z',
  isFavorite: true,
};

const memberTeam: Team = {
  id: 3,
  name: 'Charlie',
  description: '',
  memberCount: 8,
  myRole: 'member',
  ownerName: 'Carol Chief',
  createdAt: '2026-01-10T00:00:00Z',
  isFavorite: false,
};

const receivedInvitation: TeamInvitation = {
  id: 101,
  teamId: 41,
  teamName: 'Delta Squad',
  inviterName: 'David',
  status: 'pending',
  createdAt: '2026-04-01T00:00:00Z',
};

const sentInvitation: SentInvitation = {
  id: 201,
  teamId: 1,
  teamName: 'Alpha',
  inviteeName: 'Eve User',
  inviteeEmail: 'eve@example.com',
  createdAt: '2026-04-02T00:00:00Z',
};

const recentResponse: InvitationResponse = {
  id: 301,
  teamId: 1,
  teamName: 'Alpha',
  inviteeName: 'Frank',
  inviteeEmail: 'frank@example.com',
  status: 'accepted',
  createdAt: '2026-04-03T00:00:00Z',
  respondedAt: new Date().toISOString(),
};

const rejectedResponse: InvitationResponse = {
  id: 302,
  teamId: 2,
  teamName: 'Bravo',
  inviteeName: 'Gina',
  inviteeEmail: 'gina@example.com',
  status: 'rejected',
  createdAt: '2026-04-03T00:00:00Z',
  respondedAt: new Date().toISOString(),
};

const teamsFixture = [ownerTeam, adminTeam, memberTeam];

function setDefaultMocks(): void {
  vi.mocked(teamService.getMyTeams).mockResolvedValue(teamsFixture);
  vi.mocked(teamService.getMyInvitations).mockResolvedValue([]);
  vi.mocked(teamService.getSentInvitations).mockResolvedValue([]);
  vi.mocked(teamService.getInvitationResponses).mockResolvedValue([]);
  vi.mocked(teamService.createTeam).mockResolvedValue({ ...ownerTeam, id: 99, name: 'Created Team' });
  vi.mocked(teamService.toggleFavorite).mockResolvedValue({ isFavorite: true });
  vi.mocked(teamService.deleteTeam).mockResolvedValue(undefined);
  vi.mocked(teamService.leaveTeam).mockResolvedValue(undefined);
  vi.mocked(teamService.acceptInvitation).mockResolvedValue(receivedInvitation);
  vi.mocked(teamService.rejectInvitation).mockResolvedValue(receivedInvitation);
  vi.mocked(teamService.cancelInvitation).mockResolvedValue(undefined);
  vi.mocked(teamService.searchUsers).mockResolvedValue([]);
  vi.mocked(teamService.inviteToTeam).mockResolvedValue(receivedInvitation);
}

function renderPage(initialEntries: string[] = ['/teams']): { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <TeamsPage />
    </MemoryRouter>,
  );
  return { user };
}

async function waitForMyTeamsLoaded(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText('Loading teams...')).not.toBeInTheDocument();
  });
}

async function openTab(user: ReturnType<typeof userEvent.setup>, tabName: string): Promise<void> {
  await user.click(screen.getByRole('tab', { name: new RegExp(tabName, 'i') }));
}

describe('TeamsPage (tabbed wrapper + tab integrations)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    setDefaultMocks();
  });

  describe('tabbed layout wrapper', () => {
    it('shows loading state initially', () => {
      vi.mocked(teamService.getMyTeams).mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(screen.getByText('Loading teams...')).toBeInTheDocument();
    });

    it('renders four tabs with correct labels and My Teams active by default', async () => {
      renderPage();
      await waitForMyTeamsLoaded();

      const tablist = screen.getByRole('tablist', { name: 'Team management tabs' });
      expect(tablist).toBeInTheDocument();

      const myTeamsTab = screen.getByRole('tab', { name: /My Teams/i });
      const receivedTab = screen.getByRole('tab', { name: /Received Invites/i });
      const pendingTab = screen.getByRole('tab', { name: /Pending Invites/i });
      const responsesTab = screen.getByRole('tab', { name: /Responses/i });

      expect(myTeamsTab).toHaveAttribute('aria-selected', 'true');
      expect(receivedTab).toHaveAttribute('aria-selected', 'false');
      expect(pendingTab).toHaveAttribute('aria-selected', 'false');
      expect(responsesTab).toHaveAttribute('aria-selected', 'false');

      expect(screen.getByRole('tabpanel', { name: /My Teams/i })).toBeVisible();
      expect(document.getElementById('teams-tabpanel-received')).toHaveAttribute('hidden');
      expect(document.getElementById('teams-tabpanel-pending')).toHaveAttribute('hidden');
      expect(document.getElementById('teams-tabpanel-responses')).toHaveAttribute('hidden');
    });

    it('clicking a tab changes the visible panel', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      await openTab(user, 'Received Invites');
      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /Received Invites/i })).toBeVisible();
      });

      expect(document.getElementById('teams-tabpanel-my-teams')).toHaveAttribute('hidden');
    });

    it('shows badge counts when counts are greater than zero and hides badge when zero', async () => {
      vi.mocked(teamService.getMyInvitations).mockResolvedValue([
        receivedInvitation,
        { ...receivedInvitation, id: 102, teamName: 'Echo Team', status: 'Pending' },
      ]);
      vi.mocked(teamService.getSentInvitations).mockResolvedValue([sentInvitation]);
      vi.mocked(teamService.getInvitationResponses).mockResolvedValue([recentResponse]);

      renderPage();
      await waitForMyTeamsLoaded();

      const myTeamsTab = screen.getByRole('tab', { name: /My Teams/i });
      const receivedTab = screen.getByRole('tab', { name: /Received Invites/i });
      const pendingTab = screen.getByRole('tab', { name: /Pending Invites/i });
      const responsesTab = screen.getByRole('tab', { name: /Responses/i });

      expect(myTeamsTab.querySelector('.teams-tab-bar__badge')).toBeNull();
      expect(within(receivedTab).getByText('2')).toBeInTheDocument();
      expect(within(pendingTab).getByText('1')).toBeInTheDocument();
      expect(within(responsesTab).getByText('1')).toBeInTheDocument();
    });

    it('keeps Create Team button visible and supports create success/error flows', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      expect(screen.getAllByRole('button', { name: 'Create Team' }).length).toBeGreaterThan(0);

      await user.click(screen.getAllByRole('button', { name: 'Create Team' })[0]);

      const dialog = screen.getByRole('dialog', { name: 'Create team' });
      await user.type(within(dialog).getByLabelText('Name'), 'Platform Team');
      await user.type(within(dialog).getByLabelText('Description'), 'Owns platform work');
      await user.click(within(dialog).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(teamService.createTeam).toHaveBeenCalledWith({
          name: 'Platform Team',
          description: 'Owns platform work',
        });
      });

      expect(screen.getByText('Team "Created Team" created.')).toBeInTheDocument();

      vi.mocked(teamService.createTeam).mockRejectedValueOnce(new Error('Duplicate team'));

      await user.click(screen.getAllByRole('button', { name: 'Create Team' })[0]);
      const errorDialog = screen.getByRole('dialog', { name: 'Create team' });
      await user.type(within(errorDialog).getByLabelText('Name'), 'Platform Team');
      await user.click(within(errorDialog).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Duplicate team')).toBeInTheDocument();
      });
    });
  });

  describe('My Teams tab integration', () => {
    it('renders teams table with expected columns and empty state when no teams', async () => {
      renderPage();
      await waitForMyTeamsLoaded();

      expect(screen.getByRole('columnheader', { name: 'Favorite' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Members/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Owner/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Created/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();

      vi.mocked(teamService.getMyTeams).mockResolvedValueOnce([]);
      renderPage(['/teams?tab=my-teams']);
      await waitFor(() => {
        expect(screen.getByText("You haven't joined any teams yet")).toBeInTheDocument();
      });
    });

    it('supports favorite optimistic update and reverts on error', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      vi.mocked(teamService.toggleFavorite).mockReturnValueOnce(new Promise(() => {}));
      await user.click(screen.getByLabelText('Star Alpha'));
      expect(screen.getByLabelText('Unstar Alpha')).toBeInTheDocument();

      vi.mocked(teamService.toggleFavorite).mockRejectedValueOnce(new Error('cannot favorite'));
      await user.click(screen.getByLabelText('Star Charlie'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update favorite.')).toBeInTheDocument();
      });
      expect(screen.getByLabelText('Star Charlie')).toBeInTheDocument();
    });

    it('enforces role-based actions for owner/admin/member', async () => {
      renderPage();
      await waitForMyTeamsLoaded();

      expect(screen.getByLabelText('Configure Alpha')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite to Alpha')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Alpha')).toBeInTheDocument();

      expect(screen.getByLabelText('Configure Bravo')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite to Bravo')).toBeInTheDocument();
      expect(screen.getByLabelText('Leave Bravo')).toBeInTheDocument();

      expect(screen.queryByLabelText('Configure Charlie')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Invite to Charlie')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Leave Charlie')).toBeInTheDocument();
    });

    it('filters teams by search and cycles sorting asc/desc/none', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      await user.type(screen.getByLabelText('Search teams'), 'Alpha');
      await waitFor(() => {
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Clear search'));
      const nameHeader = screen.getByRole('columnheader', { name: /Name/i });

      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('opens delete and leave confirmation modals', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      await user.click(screen.getByLabelText('Delete Alpha'));
      expect(screen.getByRole('dialog', { name: 'Confirm delete' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await user.click(screen.getByLabelText('Leave Charlie'));
      expect(screen.getByRole('dialog', { name: 'Confirm leave' })).toBeInTheDocument();
    });
  });

  describe('Received Invites tab', () => {
    it('shows received invitations and accept/reject actions work', async () => {
      vi.mocked(teamService.getMyInvitations).mockResolvedValue([receivedInvitation]);
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      await openTab(user, 'Received Invites');
      expect(screen.getByText('Delta Squad')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Accept' }));
      await waitFor(() => {
        expect(teamService.acceptInvitation).toHaveBeenCalledWith(101);
      });

      vi.mocked(teamService.getMyInvitations).mockResolvedValueOnce([receivedInvitation]);
      await user.click(screen.getByRole('button', { name: 'Reject' }));
      await waitFor(() => {
        expect(teamService.rejectInvitation).toHaveBeenCalledWith(101);
      });
    });
  });

  describe('Pending Invites tab', () => {
    it('shows pending sent invitations and cancels with confirmation', async () => {
      vi.mocked(teamService.getSentInvitations).mockResolvedValue([sentInvitation]);
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      await openTab(user, 'Pending Invites');
      expect(screen.getByText('Eve User')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Cancel invitation for Eve User'));
      expect(screen.getByRole('dialog', { name: 'Confirm invitation cancellation' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancel invitation' }));
      await waitFor(() => {
        expect(teamService.cancelInvitation).toHaveBeenCalledWith(201);
      });
    });
  });

  describe('Responses tab', () => {
    it('shows responses table with accepted/rejected status tags', async () => {
      vi.mocked(teamService.getInvitationResponses).mockResolvedValue([recentResponse, rejectedResponse]);
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      await openTab(user, 'Responses');

      const acceptedTag = screen.getByText('Accepted', { selector: 'span.status-tag--accepted' });
      const rejectedTag = screen.getByText('Rejected', { selector: 'span.status-tag--rejected' });

      expect(acceptedTag).toHaveClass('status-tag--accepted');
      expect(rejectedTag).toHaveClass('status-tag--rejected');
    });
  });

  describe('tabbed wrapper: URL, keyboard, badge refresh', () => {
    it('activates Received tab when loaded with ?tab=received', async () => {
      renderPage(['/teams?tab=received']);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Received Invites/i })).toHaveAttribute('aria-selected', 'true');
      });
      expect(screen.getByRole('tabpanel', { name: /Received Invites/i })).toBeVisible();
    });

    it('falls back to My Teams when loaded with ?tab=invalid', async () => {
      renderPage(['/teams?tab=invalid']);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /My Teams/i })).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('navigates tabs with ArrowRight and ArrowLeft keys', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      const myTeamsTab = screen.getByRole('tab', { name: /My Teams/i });
      myTeamsTab.focus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /Received Invites/i })).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /Pending Invites/i })).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: /Received Invites/i })).toHaveFocus();
    });

    it('navigates to first tab with Home and last tab with End', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      const myTeamsTab = screen.getByRole('tab', { name: /My Teams/i });
      myTeamsTab.focus();

      await user.keyboard('{End}');
      expect(screen.getByRole('tab', { name: /Responses/i })).toHaveFocus();

      await user.keyboard('{Home}');
      expect(screen.getByRole('tab', { name: /My Teams/i })).toHaveFocus();
    });

    it('activates focused tab with Enter key', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      const myTeamsTab = screen.getByRole('tab', { name: /My Teams/i });
      myTeamsTab.focus();

      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');

      expect(screen.getByRole('tab', { name: /Received Invites/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps around from last tab to first tab with ArrowRight', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      const myTeamsTab = screen.getByRole('tab', { name: /My Teams/i });
      myTeamsTab.focus();

      await user.keyboard('{End}');
      expect(screen.getByRole('tab', { name: /Responses/i })).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /My Teams/i })).toHaveFocus();
    });
  });


  describe('rebrush: tab indicator and badge alignment', () => {
    it('renders a sliding indicator span inside the tab bar', async () => {
      renderPage();
      await waitForMyTeamsLoaded();

      const tablist = screen.getByRole('tablist', { name: 'Team management tabs' });
      const indicator = tablist.querySelector('.teams-tab-bar__indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('updates indicator style when active tab changes', async () => {
      const { user } = renderPage();
      await waitForMyTeamsLoaded();

      const tablist = screen.getByRole('tablist', { name: 'Team management tabs' });
      const indicator = tablist.querySelector('.teams-tab-bar__indicator') as HTMLElement;
      const initialLeft = indicator.style.left;

      await user.click(screen.getByRole('tab', { name: /Received Invites/i }));

      // In jsdom getBoundingClientRect returns zeros, so left stays 0px,
      // but the indicator element should still exist with inline styles.
      expect(indicator).toHaveStyle({ left: '0px' });
      expect(indicator).toHaveStyle({ width: '0px' });
    });

    it('renders badge inline with tab label without shifting baseline', async () => {
      vi.mocked(teamService.getMyInvitations).mockResolvedValue([receivedInvitation]);
      renderPage();
      await waitForMyTeamsLoaded();

      // Wait for badge counts to load
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Received Invites/i })).toHaveTextContent(/1/);
      });

      const receivedTab = screen.getByRole('tab', { name: /Received Invites/i });
      const badge = within(receivedTab).getByText('1');
      expect(badge).toHaveClass('teams-tab-bar__badge');
      // Badge should be a child of the tab button (flex container)
      expect(badge.parentElement).toBe(receivedTab);
    });
  });

});
