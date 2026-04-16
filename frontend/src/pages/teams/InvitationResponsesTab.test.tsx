import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationResponse } from '../../lib/api.models';
import { teamService } from '../../services/team.service';
import InvitationResponsesTab from './InvitationResponsesTab';

vi.mock('../../services/team.service', () => ({
  teamService: {
    getInvitationResponses: vi.fn(),
  },
}));

const acceptedResponse: InvitationResponse = {
  id: 1,
  teamId: 10,
  teamName: 'Alpha Team',
  inviteeName: 'Frank User',
  inviteeEmail: 'frank@example.com',
  status: 'accepted',
  createdAt: '2026-03-10T00:00:00Z',
  respondedAt: '2026-03-12T00:00:00Z',
};

const rejectedResponse: InvitationResponse = {
  id: 2,
  teamId: 20,
  teamName: 'Bravo Team',
  inviteeName: 'Gina User',
  inviteeEmail: 'gina@example.com',
  status: 'rejected',
  createdAt: '2026-03-15T00:00:00Z',
  respondedAt: '2026-03-17T00:00:00Z',
};

const responseFixtures: InvitationResponse[] = [acceptedResponse, rejectedResponse];

function renderTab() {
  const user = userEvent.setup();
  render(<InvitationResponsesTab />);
  return { user };
}

async function waitForLoaded(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText('Loading responses...')).not.toBeInTheDocument();
  });
}

describe('InvitationResponsesTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(teamService.getInvitationResponses).mockResolvedValue(responseFixtures);
  });

  it('shows loading state while fetching responses', () => {
    vi.mocked(teamService.getInvitationResponses).mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading responses...')).toBeInTheDocument();
  });

  it('renders table with correct column headers', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByRole('columnheader', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Team' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date invited' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date responded' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Response' })).toBeInTheDocument();
  });

  it('renders row data with status tags', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Frank User')).toBeInTheDocument();
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Gina User')).toBeInTheDocument();
    expect(screen.getByText('Bravo Team')).toBeInTheDocument();

    const acceptedTag = screen.getByText('Accepted', { selector: 'span.status-tag--accepted' });
    const rejectedTag = screen.getByText('Rejected', { selector: 'span.status-tag--rejected' });
    expect(acceptedTag).toHaveClass('status-tag--accepted');
    expect(rejectedTag).toHaveClass('status-tag--rejected');
  });

  it('shows empty state when no responses', async () => {
    vi.mocked(teamService.getInvitationResponses).mockResolvedValue([]);
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('No invitation responses yet.')).toBeInTheDocument();
  });

  it('filters responses by search query', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.type(screen.getByLabelText('Search invitation responses'), 'Frank');

    await waitFor(() => {
      expect(screen.getByText('Frank User')).toBeInTheDocument();
      expect(screen.queryByText('Gina User')).not.toBeInTheDocument();
    });
  });

  it('filters by status dropdown - Accepted only', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.selectOptions(screen.getByLabelText('Filter by response status'), 'Accepted');

    await waitFor(() => {
      expect(screen.getByText('Frank User')).toBeInTheDocument();
      expect(screen.queryByText('Gina User')).not.toBeInTheDocument();
    });
  });

  it('filters by status dropdown - Rejected only', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.selectOptions(screen.getByLabelText('Filter by response status'), 'Rejected');

    await waitFor(() => {
      expect(screen.getByText('Gina User')).toBeInTheDocument();
      expect(screen.queryByText('Frank User')).not.toBeInTheDocument();
    });
  });

  it('applies combined search and status filters with AND logic', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.selectOptions(screen.getByLabelText('Filter by response status'), 'Accepted');
    await user.type(screen.getByLabelText('Search invitation responses'), 'Gina');

    await waitFor(() => {
      expect(screen.getByText('No responses match your filters')).toBeInTheDocument();
    });
  });

  it('reset button clears both search and status filter', async () => {
    const { user } = renderTab();
    await waitForLoaded();

    await user.selectOptions(screen.getByLabelText('Filter by response status'), 'Accepted');
    await user.type(screen.getByLabelText('Search invitation responses'), 'Gina');

    await waitFor(() => {
      expect(screen.getByText('No responses match your filters')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => {
      expect(screen.getByText('Frank User')).toBeInTheDocument();
      expect(screen.getByText('Gina User')).toBeInTheDocument();
    });
  });

  it('renders pagination bars above and below table with First/Previous/Next/Last buttons', async () => {
    renderTab();
    await waitForLoaded();

    expect(screen.getAllByLabelText('First page')).toHaveLength(2);
    expect(screen.getAllByLabelText('Previous page')).toHaveLength(2);
    expect(screen.getAllByLabelText('Next page')).toHaveLength(2);
    expect(screen.getAllByLabelText('Last page')).toHaveLength(2);
  });

  it('has page-size dropdown defaulting to 25', async () => {
    renderTab();
    await waitForLoaded();

    const select = screen.getByLabelText('Rows per page');
    expect(select).toHaveValue('25');
  });

  it('shows error message when data load fails', async () => {
    vi.mocked(teamService.getInvitationResponses).mockRejectedValue(new Error('Server down'));
    renderTab();
    await waitForLoaded();

    expect(screen.getByText('Server down')).toBeInTheDocument();
  });
});
