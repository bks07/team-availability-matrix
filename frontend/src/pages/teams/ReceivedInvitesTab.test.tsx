import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeamInvitation } from '../../lib/api.models';
import { teamService } from '../../services/team.service';
import ReceivedInvitesTab from './ReceivedInvitesTab';

vi.mock('../../services/team.service', () => ({
  teamService: {
    getMyInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
  },
}));

const inv1: TeamInvitation = {
  id: 1,
  teamId: 10,
  teamName: 'Alpha Team',
  inviterName: 'Alice',
  status: 'pending',
  createdAt: '2026-03-15T00:00:00Z',
};

const inv2: TeamInvitation = {
  id: 2,
  teamId: 20,
  teamName: 'Bravo Team',
  inviterName: 'Bob',
  status: 'pending',
  createdAt: '2026-03-20T00:00:00Z',
};

const inv3: TeamInvitation = {
  id: 3,
  teamId: 30,
  teamName: 'Charlie Team',
  inviterName: 'Carol',
  status: 'accepted',
  createdAt: '2026-03-25T00:00:00Z',
};

const pendingFixtures: TeamInvitation[] = [inv1, inv2, inv3];

function renderTab(onDataChanged = vi.fn()) {
  const user = userEvent.setup();
  render(<ReceivedInvitesTab onDataChanged={onDataChanged} />);
  return { user, onDataChanged };
}

async function waitForLoaded(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText('Loading invitations...')).not.toBeInTheDocument();
  });
}

describe('ReceivedInvitesTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(teamService.getMyInvitations).mockResolvedValue(pendingFixtures);
    vi.mocked(teamService.acceptInvitation).mockResolvedValue(inv1);
    vi.mocked(teamService.rejectInvitation).mockResolvedValue(inv1);
  });

  it('shows loading state while fetching invitations', () => {
    vi.mocked(teamService.getMyInvitations).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading invitations...')).toBeInTheDocument();
  });

  it('renders table with correct column headers', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByRole('columnheader', { name: 'Team' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Invited by' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date invited' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  });

  it('renders pending invitation rows and filters out non-pending', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bravo Team')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Charlie Team')).not.toBeInTheDocument();
  });

  it('renders Accept and Reject buttons for each invitation', async () => {
    renderTab();
    await waitForLoaded();

    const acceptButtons = screen.getAllByRole('button', { name: 'Accept' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Reject' });
    expect(acceptButtons).toHaveLength(2);
    expect(rejectButtons).toHaveLength(2);
  });

  it('calls acceptInvitation and shows success message', async () => {
    const onDataChanged = vi.fn();
    const { user } = renderTab(onDataChanged);
    await waitForLoaded();

    const acceptButtons = screen.getAllByRole('button', { name: 'Accept' });
    await user.click(acceptButtons[0]);

    await waitFor(() => {
      expect(teamService.acceptInvitation).toHaveBeenCalledWith(1);
    });
    expect(screen.getByText('Invitation accepted.')).toBeInTheDocument();
    expect(onDataChanged).toHaveBeenCalled();
  });

  it('calls rejectInvitation and shows success message', async () => {
    const onDataChanged = vi.fn();
    const { user } = renderTab(onDataChanged);
    await waitForLoaded();

    const rejectButtons = screen.getAllByRole('button', { name: 'Reject' });
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(teamService.rejectInvitation).toHaveBeenCalledWith(1);
    });
    expect(screen.getByText('Invitation rejected.')).toBeInTheDocument();
    expect(onDataChanged).toHaveBeenCalled();
  });

  it('disables both buttons while processing an action', async () => {
    vi.mocked(teamService.acceptInvitation).mockReturnValue(new Promise(() => {}));
    const { user } = renderTab();
    await waitForLoaded();

    const acceptButtons = screen.getAllByRole('button', { name: 'Accept' });
    await user.click(acceptButtons[0]);

    const rejectButtons = screen.getAllByRole('button', { name: 'Reject' });
    expect(acceptButtons[0]).toBeDisabled();
    expect(rejectButtons[0]).toBeDisabled();
    expect(acceptButtons[1]).toBeEnabled();
  });

  it('shows error message when accept fails', async () => {
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(new Error('Network error'));
    const { user } = renderTab();
    await waitForLoaded();

    await user.click(screen.getAllByRole('button', { name: 'Accept' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no pending invitations', async () => {
    vi.mocked(teamService.getMyInvitations).mockResolvedValue([]);
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('You have no pending invitations.')).toBeInTheDocument();
  });

  it('filters invitations by search query', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    const searchInput = screen.getByLabelText('Search invitations');
    await user.type(searchInput, 'Alpha');

    await waitFor(() => {
      expect(screen.getByText('Alpha Team')).toBeInTheDocument();
      expect(screen.queryByText('Bravo Team')).not.toBeInTheDocument();
    });
  });

  it('shows no-match message when search has no results', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.type(screen.getByLabelText('Search invitations'), 'zzzzz');

    await waitFor(() => {
      expect(screen.getByText('No invitations match your search')).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.type(screen.getByLabelText('Search invitations'), 'Alpha');
    await waitFor(() => {
      expect(screen.queryByText('Bravo Team')).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Clear search'));
    await waitFor(() => {
      expect(screen.getByText('Bravo Team')).toBeInTheDocument();
    });
  });

  it('renders pagination bar with First/Previous/Next/Last buttons', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByLabelText('First page')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Last page')).toBeInTheDocument();
  });

  it('has page-size dropdown defaulting to 25 with 10/25/50 options', async () => {
    renderTab();
    await waitForLoaded();

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('25');

    const options = Array.from(select.querySelectorAll('option')).map((o: Element) => o.textContent);
    expect(options).toEqual(['10', '25', '50']);
  });

  it('shows error message when data load fails', async () => {
    vi.mocked(teamService.getMyInvitations).mockRejectedValue(new Error('Server down'));
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Server down')).toBeInTheDocument();
  });
});
