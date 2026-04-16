import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Team } from '../../lib/api.models';
import { teamService } from '../../services/team.service';
import MyTeamsTab from './MyTeamsTab';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/team.service', () => ({
  teamService: {
    getMyTeams: vi.fn(),
    deleteTeam: vi.fn(),
    leaveTeam: vi.fn(),
    toggleFavorite: vi.fn(),
    searchUsers: vi.fn(),
    inviteToTeam: vi.fn(),
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

const teamsFixture: Team[] = [ownerTeam, adminTeam, memberTeam];

function renderTab(onDataChanged = vi.fn(), onOpenCreateModal = vi.fn()) {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <MyTeamsTab onDataChanged={onDataChanged} onOpenCreateModal={onOpenCreateModal} />
    </MemoryRouter>,
  );
  return { user, onDataChanged, onOpenCreateModal };
}

async function waitForLoaded(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText('Loading teams...')).not.toBeInTheDocument();
  });
}

describe('MyTeamsTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    vi.mocked(teamService.getMyTeams).mockResolvedValue(teamsFixture);
    vi.mocked(teamService.deleteTeam).mockResolvedValue(undefined);
    vi.mocked(teamService.leaveTeam).mockResolvedValue(undefined);
    vi.mocked(teamService.toggleFavorite).mockResolvedValue({ isFavorite: true });
    vi.mocked(teamService.searchUsers).mockResolvedValue([]);
    vi.mocked(teamService.inviteToTeam).mockResolvedValue(undefined as any);
  });

  it('shows loading state while fetching teams', () => {
    vi.mocked(teamService.getMyTeams).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading teams...')).toBeInTheDocument();
  });

  it('shows empty state with create prompt when no teams', async () => {
    vi.mocked(teamService.getMyTeams).mockResolvedValue([]);
    const onOpenCreateModal = vi.fn();
    const { user } = renderTab(vi.fn(), onOpenCreateModal);
    await waitForLoaded();

    expect(screen.getByText("You haven't joined any teams yet")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create your first team' }));
    expect(onOpenCreateModal).toHaveBeenCalled();
  });

  it('shows admin badge for admin role teams', async () => {
    renderTab();
    await waitForLoaded();

    const adminBadges = document.querySelectorAll('.admin-badge');
    expect(adminBadges).toHaveLength(1);
    expect(adminBadges[0].textContent).toBe('Admin');
  });

  it('shows em dash for empty description', async () => {
    renderTab();
    await waitForLoaded();

    // Find Charlie row (memberTeam with empty description)
    // Favorites sort puts adminTeam (isFavorite:true) first, then Alpha, then Charlie
    const descriptionCells = document.querySelectorAll('td.teams-col-desc');
    const emDashFound = Array.from(descriptionCells).some((cell) => cell.textContent === '\u2014');
    expect(emDashFound).toBe(true);
  });

  it('renders member count for each team', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('highlights owner name with owner-highlight class', async () => {
    renderTab();
    await waitForLoaded();

    const ownerHighlights = document.querySelectorAll('.owner-highlight');
    expect(ownerHighlights).toHaveLength(1);
    expect(ownerHighlights[0].textContent).toBe('Alice Owner');
  });

  it('formats dates in the table', async () => {
    renderTab();
    await waitForLoaded();

    // Check at least one formatted date is present (browser locale dependent)
    const date = new Date('2026-03-10T00:00:00Z').toLocaleDateString();
    expect(screen.getByText(date)).toBeInTheDocument();
  });

  it('renders pagination bars above and below table with First/Previous/Next/Last buttons', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getAllByLabelText('First page')).toHaveLength(2);
    expect(screen.getAllByLabelText('Previous page')).toHaveLength(2);
    expect(screen.getAllByLabelText('Next page')).toHaveLength(2);
    expect(screen.getAllByLabelText('Last page')).toHaveLength(2);
  });

  it('has page-size dropdown defaulting to 25 with 10/25/50/100 options', async () => {
    renderTab();
    await waitForLoaded();

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('25');

    const options = Array.from(select.querySelectorAll('option')).map((o: Element) => o.textContent);
    expect(options).toEqual(['10', '25', '50', '100']);
  });

  it('deletes team with confirmation dialog and shows success', async () => {
    const onDataChanged = vi.fn();
    const { user } = renderTab(onDataChanged);
    await waitForLoaded();

    await user.click(screen.getByLabelText('Delete Alpha'));
    expect(screen.getByRole('dialog', { name: 'Confirm delete' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(teamService.deleteTeam).toHaveBeenCalledWith(1);
    });
    expect(screen.getByText('Team "Alpha" deleted.')).toBeInTheDocument();
    expect(onDataChanged).toHaveBeenCalled();
  });

  it('leaves team with confirmation dialog and shows success', async () => {
    const onDataChanged = vi.fn();
    const { user } = renderTab(onDataChanged);
    await waitForLoaded();

    await user.click(screen.getByLabelText('Leave Charlie'));
    expect(screen.getByRole('dialog', { name: 'Confirm leave' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave' }));

    await waitFor(() => {
      expect(teamService.leaveTeam).toHaveBeenCalledWith(3);
    });
    expect(screen.getByText('You left "Charlie".')).toBeInTheDocument();
    expect(onDataChanged).toHaveBeenCalled();
  });

  it('shows error message when data load fails', async () => {
    vi.mocked(teamService.getMyTeams).mockRejectedValue(new Error('Server down'));
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Server down')).toBeInTheDocument();
  });

  it('sorts favorites to top of table', async () => {
    renderTab();
    await waitForLoaded();

    const rows = screen.getAllByRole('row');
    // Row 0 is thead, row 1 should be Bravo (isFavorite: true)
    const firstDataRow = rows[1];
    expect(firstDataRow.textContent).toContain('Bravo');
  });
});
