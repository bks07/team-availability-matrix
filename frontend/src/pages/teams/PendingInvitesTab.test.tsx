import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SentInvitation } from '../../lib/api.models';
import { teamService } from '../../services/team.service';
import PendingInvitesTab from './PendingInvitesTab';

vi.mock('../../services/team.service', () => ({
  teamService: {
    getSentInvitations: vi.fn(),
    cancelInvitation: vi.fn(),
  },
}));

const sent1: SentInvitation = {
  id: 1,
  teamId: 10,
  teamName: 'Alpha Team',
  inviteeName: 'Eve User',
  inviteeEmail: 'eve@example.com',
  createdAt: '2026-03-15T00:00:00Z',
};

const sent2: SentInvitation = {
  id: 2,
  teamId: 20,
  teamName: 'Bravo Team',
  inviteeName: 'Frank User',
  inviteeEmail: 'frank@example.com',
  createdAt: '2026-03-20T00:00:00Z',
};

const sentFixtures: SentInvitation[] = [sent1, sent2];

function renderTab(onDataChanged = vi.fn()) {
  const user = userEvent.setup();
  render(<PendingInvitesTab onDataChanged={onDataChanged} />);
  return { user, onDataChanged };
}

async function waitForLoaded(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText('Loading sent invitations...')).not.toBeInTheDocument();
  });
}

describe('PendingInvitesTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(teamService.getSentInvitations).mockResolvedValue(sentFixtures);
    vi.mocked(teamService.cancelInvitation).mockResolvedValue(undefined);
  });

  it('shows loading state while fetching invitations', () => {
    vi.mocked(teamService.getSentInvitations).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading sent invitations...')).toBeInTheDocument();
  });

  it('renders table with correct column headers', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByRole('columnheader', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Team' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date invited' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
  });

  it('renders sent invitation rows', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Eve User')).toBeInTheDocument();
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Frank User')).toBeInTheDocument();
    expect(screen.getByText('Bravo Team')).toBeInTheDocument();
  });

  it('renders delete button with correct aria-labels', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByLabelText('Cancel invitation for Eve User')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancel invitation for Frank User')).toBeInTheDocument();
  });

  it('opens confirmation dialog when delete button is clicked', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.click(screen.getByLabelText('Cancel invitation for Eve User'));

    const dialog = screen.getByRole('dialog', { name: 'Confirm invitation cancellation' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Cancel invitation for Eve User to Alpha Team/)).toBeInTheDocument();
  });

  it('cancels invitation on confirm and shows success', async () => {
    const onDataChanged = vi.fn();
    const { user } = renderTab(onDataChanged);
    await waitForLoaded();

    await user.click(screen.getByLabelText('Cancel invitation for Eve User'));
    await user.click(screen.getByRole('button', { name: 'Cancel invitation' }));

    await waitFor(() => {
      expect(teamService.cancelInvitation).toHaveBeenCalledWith(1);
    });
    expect(screen.getByText('Invitation cancelled.')).toBeInTheDocument();
    expect(onDataChanged).toHaveBeenCalled();
  });

  it('dismisses dialog when Keep button is clicked', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.click(screen.getByLabelText('Cancel invitation for Eve User'));
    expect(screen.getByRole('dialog', { name: 'Confirm invitation cancellation' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows error message when cancel fails', async () => {
    vi.mocked(teamService.cancelInvitation).mockRejectedValue(new Error('Failed to cancel invitation.'));
    const { user } = renderTab();
    await waitForLoaded();

    await user.click(screen.getByLabelText('Cancel invitation for Eve User'));
    await user.click(screen.getByRole('button', { name: 'Cancel invitation' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to cancel invitation.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no sent invitations', async () => {
    vi.mocked(teamService.getSentInvitations).mockResolvedValue([]);
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('You have no pending outbound invitations.')).toBeInTheDocument();
  });

  it('filters invitations by search query', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.type(screen.getByLabelText('Search pending invitations'), 'Eve');

    await waitFor(() => {
      expect(screen.getByText('Eve User')).toBeInTheDocument();
      expect(screen.queryByText('Frank User')).not.toBeInTheDocument();
    });
  });

  it('shows no-match message when search has no results', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.type(screen.getByLabelText('Search pending invitations'), 'zzzzz');

    await waitFor(() => {
      expect(screen.getByText('No invitations match your search')).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.type(screen.getByLabelText('Search pending invitations'), 'Eve');
    await waitFor(() => {
      expect(screen.queryByText('Frank User')).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Clear search'));
    await waitFor(() => {
      expect(screen.getByText('Frank User')).toBeInTheDocument();
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
    vi.mocked(teamService.getSentInvitations).mockRejectedValue(new Error('Server down'));
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Server down')).toBeInTheDocument();
  });
});
