import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamsPage from './TeamsPage';
import { teamService } from '../services/team.service';
import type { Team, TeamInvitation } from '../lib/api.models';

// ── Mocks ───────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../services/team.service', () => ({
  teamService: {
    getMyTeams: vi.fn(),
    getMyInvitations: vi.fn(),
    createTeam: vi.fn(),
    deleteTeam: vi.fn(),
    leaveTeam: vi.fn(),
    toggleFavorite: vi.fn(),
    searchUsers: vi.fn(),
    inviteToTeam: vi.fn(),
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
  },
}));

// ── Fixtures ────────────────────────────────────────────────

const ownerTeam: Team = {
  id: 1,
  name: 'Alpha',
  description: 'Alpha description',
  memberCount: 5,
  myRole: 'owner',
  ownerName: 'Alice Owner',
  createdAt: '2025-06-01T00:00:00Z',
  isFavorite: false,
};

const adminTeam: Team = {
  id: 2,
  name: 'Bravo',
  description: 'Bravo description',
  memberCount: 3,
  myRole: 'admin',
  ownerName: 'Bob Boss',
  createdAt: '2025-03-15T00:00:00Z',
  isFavorite: true,
};

const memberTeam: Team = {
  id: 3,
  name: 'Charlie',
  description: '',
  memberCount: 8,
  myRole: 'member',
  ownerName: 'Carol Chief',
  createdAt: '2025-09-20T00:00:00Z',
  isFavorite: false,
};

const pendingInvitation: TeamInvitation = {
  id: 10,
  teamId: 99,
  teamName: 'Delta Squad',
  inviterName: 'Dave',
  status: 'Pending',
  createdAt: '2025-04-01T00:00:00Z',
};

const allTeams = [ownerTeam, adminTeam, memberTeam];

// ── Helpers ─────────────────────────────────────────────────

function setupMocks(teams: Team[] = allTeams, invitations: TeamInvitation[] = []) {
  vi.mocked(teamService.getMyTeams).mockResolvedValue(teams);
  vi.mocked(teamService.getMyInvitations).mockResolvedValue(invitations);
}

async function renderPage() {
  const user = userEvent.setup();
  render(<TeamsPage />);
  await waitFor(() => {
    expect(screen.queryByText('Loading teams...')).not.toBeInTheDocument();
  });
  return { user };
}

// ── Tests ───────────────────────────────────────────────────

describe('TeamsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
  });

  // ── Loading & Empty State ─────────────────────────────────

  describe('loading state', () => {
    it('shows loading indicator while fetching data', () => {
      vi.mocked(teamService.getMyTeams).mockReturnValue(new Promise(() => {}));
      vi.mocked(teamService.getMyInvitations).mockReturnValue(new Promise(() => {}));

      render(<TeamsPage />);
      expect(screen.getByText('Loading teams...')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty message when user has no teams and no invitations', async () => {
      setupMocks([], []);
      await renderPage();

      expect(screen.getByText("You haven't joined any teams yet")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create your first team' })).toBeInTheDocument();
    });

    it('does not show table or search when no teams', async () => {
      setupMocks([], []);
      await renderPage();

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Search teams')).not.toBeInTheDocument();
    });
  });

  // ── Table Rendering ─────────────────────────────────────

  describe('table rendering', () => {
    it('renders all teams in a table', async () => {
      setupMocks();
      await renderPage();

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      expect(screen.getByText('Favorite')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Members/ })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Owner/ })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Created/ })).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      for (const team of allTeams) {
        expect(screen.getByText(team.name)).toBeInTheDocument();
        expect(screen.getByText(team.ownerName)).toBeInTheDocument();
      }
    });

    it('renders description or em dash for empty descriptions', async () => {
      setupMocks();
      await renderPage();

      expect(screen.getByText('Alpha description')).toBeInTheDocument();
      expect(screen.getByText('\u2014')).toBeInTheDocument();
    });

    it('renders member counts', async () => {
      setupMocks();
      await renderPage();

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('shows Admin badge for admin role', async () => {
      setupMocks();
      await renderPage();

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  // ── Role-Based Actions ──────────────────────────────────

  describe('role-based actions', () => {
    it('shows configure, invite, and delete for owner', async () => {
      setupMocks([ownerTeam]);
      await renderPage();

      expect(screen.getByLabelText('Configure Alpha')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite to Alpha')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Alpha')).toBeInTheDocument();
      expect(screen.queryByLabelText('Leave Alpha')).not.toBeInTheDocument();
    });

    it('shows configure, invite, and leave for admin', async () => {
      setupMocks([adminTeam]);
      await renderPage();

      expect(screen.getByLabelText('Configure Bravo')).toBeInTheDocument();
      expect(screen.getByLabelText('Invite to Bravo')).toBeInTheDocument();
      expect(screen.getByLabelText('Leave Bravo')).toBeInTheDocument();
      expect(screen.queryByLabelText('Delete Bravo')).not.toBeInTheDocument();
    });

    it('shows only leave for member', async () => {
      setupMocks([memberTeam]);
      await renderPage();

      expect(screen.queryByLabelText('Configure Charlie')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Invite to Charlie')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Delete Charlie')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Leave Charlie')).toBeInTheDocument();
    });

    it('navigates to team detail when configure is clicked', async () => {
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Configure Alpha'));
      expect(mockNavigate).toHaveBeenCalledWith('/teams/1');
    });
  });

  // ── Favorite Toggle ───────────────────────────────────────

  describe('favorite toggle', () => {
    it('renders filled star for favorite teams', async () => {
      setupMocks([adminTeam]);
      await renderPage();

      const starBtn = screen.getByLabelText('Unstar Bravo');
      expect(starBtn).toHaveTextContent('\u2605');
    });

    it('renders empty star for non-favorite teams', async () => {
      setupMocks([ownerTeam]);
      await renderPage();

      const starBtn = screen.getByLabelText('Star Alpha');
      expect(starBtn).toHaveTextContent('\u2606');
    });

    it('optimistically toggles favorite and calls service', async () => {
      vi.mocked(teamService.toggleFavorite).mockResolvedValue({ isFavorite: true });
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      const starBtn = screen.getByLabelText('Star Alpha');
      await user.click(starBtn);

      expect(screen.getByLabelText('Unstar Alpha')).toHaveTextContent('\u2605');
      expect(teamService.toggleFavorite).toHaveBeenCalledWith(1);
    });

    it('reverts favorite on API error', async () => {
      vi.mocked(teamService.toggleFavorite).mockRejectedValue(new Error('fail'));
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Star Alpha'));

      await waitFor(() => {
        expect(screen.getByText('Failed to update favorite.')).toBeInTheDocument();
      });
      expect(screen.getByLabelText('Star Alpha')).toHaveTextContent('\u2606');
    });

    it('favorite teams sort before non-favorites', async () => {
      setupMocks();
      await renderPage();

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Bravo')).toBeInTheDocument();
    });
  });

  // ── Search & Filter ───────────────────────────────────────

  describe('search and filter', () => {
    it('filters teams by name', async () => {
      setupMocks();
      const { user } = await renderPage();

      const searchInput = screen.getByLabelText('Search teams');
      await user.type(searchInput, 'Alpha');

      await waitFor(() => {
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      });
    });

    it('filters teams by owner name', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.type(screen.getByLabelText('Search teams'), 'Carol');

      await waitFor(() => {
        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      });
    });

    it('filters teams by description', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.type(screen.getByLabelText('Search teams'), 'Bravo description');

      await waitFor(() => {
        expect(screen.getByText('Bravo')).toBeInTheDocument();
        expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
      });
    });

    it('shows no-match message for zero results', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.type(screen.getByLabelText('Search teams'), 'zzzzz');

      await waitFor(() => {
        expect(screen.getByText('No teams match your search')).toBeInTheDocument();
      });
    });

    it('clears search when clear button is clicked', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.type(screen.getByLabelText('Search teams'), 'Alpha');

      await waitFor(() => {
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Clear search'));

      await waitFor(() => {
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
      });
    });

    it('search is case-insensitive', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.type(screen.getByLabelText('Search teams'), 'alpha');

      await waitFor(() => {
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      });
    });
  });

  // ── Sorting ───────────────────────────────────────────────

  describe('sorting', () => {
    it('sorts ascending on first click', async () => {
      setupMocks();
      const { user } = await renderPage();

      const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
      await user.click(nameHeader);

      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('sorts descending on second click', async () => {
      setupMocks();
      const { user } = await renderPage();

      const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
      await user.click(nameHeader);
      await user.click(nameHeader);

      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('resets sort on third click', async () => {
      setupMocks();
      const { user } = await renderPage();

      const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
      await user.click(nameHeader);
      await user.click(nameHeader);
      await user.click(nameHeader);

      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('shows sort indicators', async () => {
      setupMocks();
      const { user } = await renderPage();

      const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
      await user.click(nameHeader);
      expect(nameHeader).toHaveTextContent('Name \u25b2');

      await user.click(nameHeader);
      expect(nameHeader).toHaveTextContent('Name \u25bc');
    });

    it('can sort by members column', async () => {
      setupMocks();
      const { user } = await renderPage();

      const membersHeader = screen.getByRole('columnheader', { name: /Members/ });
      await user.click(membersHeader);

      expect(membersHeader).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  // ── Create Team Modal ─────────────────────────────────────

  describe('create team modal', () => {
    it('opens modal on Create Team button click', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: 'Create Team' }));

      expect(screen.getByRole('dialog', { name: 'Create team' })).toBeInTheDocument();
    });

    it('creates team and reloads data on submit', async () => {
      vi.mocked(teamService.createTeam).mockResolvedValue({ ...ownerTeam, name: 'New Team' });
      setupMocks();
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: 'Create Team' }));

      const dialog = screen.getByRole('dialog', { name: 'Create team' });
      await user.type(within(dialog).getByLabelText('Name'), 'New Team');
      await user.type(within(dialog).getByLabelText('Description'), 'A new team');
      await user.click(within(dialog).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(teamService.createTeam).toHaveBeenCalledWith({
          name: 'New Team',
          description: 'A new team',
        });
      });

      expect(screen.getByText('Team "New Team" created.')).toBeInTheDocument();
    });

    it('shows error when create fails', async () => {
      vi.mocked(teamService.createTeam).mockRejectedValue(new Error('Name taken'));
      setupMocks();
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: 'Create Team' }));

      const dialog = screen.getByRole('dialog', { name: 'Create team' });
      await user.type(within(dialog).getByLabelText('Name'), 'Duplicate');
      await user.click(within(dialog).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Name taken')).toBeInTheDocument();
      });
    });

    it('closes modal on Cancel', async () => {
      setupMocks();
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: 'Create Team' }));
      expect(screen.getByRole('dialog', { name: 'Create team' })).toBeInTheDocument();

      const dialog = screen.getByRole('dialog', { name: 'Create team' });
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog', { name: 'Create team' })).not.toBeInTheDocument();
    });
  });

  // ── Delete Confirmation ───────────────────────────────────

  describe('delete team', () => {
    it('opens delete confirmation modal', async () => {
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Delete Alpha'));

      const dialog = screen.getByRole('dialog', { name: 'Confirm delete' });
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Are you sure you want to delete "Alpha"/)).toBeInTheDocument();
    });

    it('deletes team on confirm and shows success', async () => {
      vi.mocked(teamService.deleteTeam).mockResolvedValue(undefined);
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Delete Alpha'));
      const dialog = screen.getByRole('dialog', { name: 'Confirm delete' });
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(teamService.deleteTeam).toHaveBeenCalledWith(1);
        expect(screen.getByText('Team "Alpha" deleted.')).toBeInTheDocument();
      });
    });

    it('cancels delete confirmation', async () => {
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Delete Alpha'));
      const dialog = screen.getByRole('dialog', { name: 'Confirm delete' });
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog', { name: 'Confirm delete' })).not.toBeInTheDocument();
    });
  });

  // ── Leave Confirmation ────────────────────────────────────

  describe('leave team', () => {
    it('opens leave confirmation modal', async () => {
      setupMocks([memberTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Leave Charlie'));

      const dialog = screen.getByRole('dialog', { name: 'Confirm leave' });
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Are you sure you want to leave "Charlie"/)).toBeInTheDocument();
    });

    it('leaves team on confirm', async () => {
      vi.mocked(teamService.leaveTeam).mockResolvedValue(undefined);
      setupMocks([memberTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Leave Charlie'));
      const dialog = screen.getByRole('dialog', { name: 'Confirm leave' });
      await user.click(within(dialog).getByRole('button', { name: 'Leave' }));

      await waitFor(() => {
        expect(teamService.leaveTeam).toHaveBeenCalledWith(3);
        expect(screen.getByText('You left "Charlie".')).toBeInTheDocument();
      });
    });
  });

  // ── Invite Modal ──────────────────────────────────────────

  describe('invite modal', () => {
    it('opens invite modal and searches users', async () => {
      const mockUsers = [{ id: 100, displayName: 'Eve', email: 'eve@test.com' }];
      vi.mocked(teamService.searchUsers).mockResolvedValue(mockUsers);
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Invite to Alpha'));

      const dialog = screen.getByRole('dialog', { name: 'Invite to team' });
      expect(dialog).toBeInTheDocument();

      await user.type(within(dialog).getByPlaceholderText('Search by name or email...'), 'Eve');

      await waitFor(() => {
        expect(teamService.searchUsers).toHaveBeenCalled();
        expect(screen.getByText('Eve (eve@test.com)')).toBeInTheDocument();
      });
    });

    it('sends invitation when user is selected', async () => {
      vi.mocked(teamService.searchUsers).mockResolvedValue([
        { id: 100, displayName: 'Eve', email: 'eve@test.com' },
      ]);
      vi.mocked(teamService.inviteToTeam).mockResolvedValue({
        id: 20,
        teamId: 1,
        teamName: 'Alpha',
        inviterName: 'Me',
        status: 'Pending',
        createdAt: '2025-04-09T00:00:00Z',
      });
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Invite to Alpha'));
      const dialog = screen.getByRole('dialog', { name: 'Invite to team' });
      await user.type(within(dialog).getByPlaceholderText('Search by name or email...'), 'Eve');

      await waitFor(() => {
        expect(screen.getByText('Eve (eve@test.com)')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Invite' }));

      await waitFor(() => {
        expect(teamService.inviteToTeam).toHaveBeenCalledWith(1, 100);
        expect(screen.getByText('Invitation sent.')).toBeInTheDocument();
      });
    });

    it('closes invite modal on Close button', async () => {
      setupMocks([ownerTeam]);
      const { user } = await renderPage();

      await user.click(screen.getByLabelText('Invite to Alpha'));
      expect(screen.getByRole('dialog', { name: 'Invite to team' })).toBeInTheDocument();

      const dialog = screen.getByRole('dialog', { name: 'Invite to team' });
      await user.click(within(dialog).getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog', { name: 'Invite to team' })).not.toBeInTheDocument();
    });
  });

  // ── Pending Invitations ───────────────────────────────────

  describe('pending invitations', () => {
    it('renders pending invitations section', async () => {
      setupMocks(allTeams, [pendingInvitation]);
      await renderPage();

      expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
      expect(screen.getByText('Delta Squad')).toBeInTheDocument();
      expect(screen.getByText(/Invited by Dave/)).toBeInTheDocument();
    });

    it('does not show invitations section when none exist', async () => {
      setupMocks(allTeams, []);
      await renderPage();

      expect(screen.queryByText('Pending Invitations')).not.toBeInTheDocument();
    });

    it('accepts an invitation', async () => {
      vi.mocked(teamService.acceptInvitation).mockResolvedValue({
        ...pendingInvitation,
        status: 'Accepted',
      });
      setupMocks(allTeams, [pendingInvitation]);
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: 'Accept' }));

      await waitFor(() => {
        expect(teamService.acceptInvitation).toHaveBeenCalledWith(10);
        expect(screen.getByText('Invitation accepted.')).toBeInTheDocument();
      });
    });

    it('rejects an invitation', async () => {
      vi.mocked(teamService.rejectInvitation).mockResolvedValue({
        ...pendingInvitation,
        status: 'Rejected',
      });
      setupMocks(allTeams, [pendingInvitation]);
      const { user } = await renderPage();

      await user.click(screen.getByRole('button', { name: 'Reject' }));

      await waitFor(() => {
        expect(teamService.rejectInvitation).toHaveBeenCalledWith(10);
        expect(screen.getByText('Invitation rejected.')).toBeInTheDocument();
      });
    });

    it('filters out non-pending invitations', async () => {
      const acceptedInvitation: TeamInvitation = {
        ...pendingInvitation,
        id: 11,
        teamName: 'Accepted Team',
        status: 'Accepted',
      };
      setupMocks(allTeams, [pendingInvitation, acceptedInvitation]);
      await renderPage();

      expect(screen.getByText('Delta Squad')).toBeInTheDocument();
      expect(screen.queryByText('Accepted Team')).not.toBeInTheDocument();
    });
  });

  // ── Error Handling ────────────────────────────────────────

  describe('error handling', () => {
    it('shows error message when loading fails', async () => {
      vi.mocked(teamService.getMyTeams).mockRejectedValue(new Error('Network error'));
      vi.mocked(teamService.getMyInvitations).mockResolvedValue([]);

      render(<TeamsPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
