import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { TeamInvitation } from '../lib/api.models';
import type { UseNotificationsResult } from '../hooks/useNotifications';
import TaskListPopover from './TaskListPopover';

const inv1: TeamInvitation = { id: 1, teamId: 10, teamName: 'Alpha Team', inviterName: 'Alice', status: 'pending', createdAt: '2026-04-13T10:00:00Z' };
const inv2: TeamInvitation = { id: 2, teamId: 20, teamName: 'Bravo Team', inviterName: 'Bob', status: 'pending', createdAt: '2026-04-12T08:00:00Z' };

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function createMock(overrides: Partial<UseNotificationsResult> = {}): UseNotificationsResult {
  return {
    invitations: [inv1, inv2],
    count: 2,
    isLoading: false,
    error: null,
    pulseTriggered: false,
    clearPulse: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    acceptInvitation: vi.fn().mockResolvedValue(undefined),
    rejectInvitation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderPopover(overrides: Partial<UseNotificationsResult> = {}, onClose = vi.fn()) {
  const user = userEvent.setup();
  const mock = createMock(overrides);
  render(
    <MemoryRouter>
      <TaskListPopover notifications={mock} onClose={onClose} />
    </MemoryRouter>
  );
  return { user, mock, onClose };
}

describe('TaskListPopover', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders header with title and count', () => {
    renderPopover();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders invitation rows with team name and inviter', () => {
    renderPopover();
    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('Invited by Alice')).toBeInTheDocument();
    expect(screen.getByText('Bravo Team')).toBeInTheDocument();
    expect(screen.getByText('Invited by Bob')).toBeInTheDocument();
  });

  it('renders accept and reject buttons with accessible labels', () => {
    renderPopover();
    expect(screen.getByRole('button', { name: 'Accept invitation to Alpha Team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject invitation to Alpha Team' })).toBeInTheDocument();
  });

  it('calls acceptInvitation when accept is clicked', async () => {
    const { user, mock } = renderPopover();
    const acceptBtn = screen.getByRole('button', { name: 'Accept invitation to Alpha Team' });
    await user.click(acceptBtn);
    expect(mock.acceptInvitation).toHaveBeenCalledWith(1);
  });

  it('calls rejectInvitation when reject is clicked', async () => {
    const { user, mock } = renderPopover();
    const rejectBtn = screen.getByRole('button', { name: 'Reject invitation to Alpha Team' });
    await user.click(rejectBtn);
    expect(mock.rejectInvitation).toHaveBeenCalledWith(1);
  });

  it('shows empty state when no invitations', () => {
    renderPopover({ invitations: [], count: 0 });
    expect(screen.getByText(/All caught up/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderPopover({ invitations: [], count: 0, isLoading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    renderPopover({ invitations: [], count: 0, error: 'network' });
    expect(screen.getByText(/Could not load notifications/)).toBeInTheDocument();
  });

  it('calls refresh when error is clicked', async () => {
    const { user, mock } = renderPopover({ invitations: [], count: 0, error: 'network' });
    await user.click(screen.getByText(/Could not load notifications/));
    expect(mock.refresh).toHaveBeenCalled();
  });

  it('has aria dialog role', () => {
    renderPopover();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('navigates to /teams?tab=received on row click', async () => {
    const onClose = vi.fn();
    const { user } = renderPopover({}, onClose);
    await user.click(screen.getByText('Alpha Team'));
    expect(mockNavigate).toHaveBeenCalledWith('/teams?tab=received');
    expect(onClose).toHaveBeenCalled();
  });

  it('supports Arrow-Down/Up keyboard navigation', () => {
    renderPopover();
    const dialog = screen.getByRole('dialog');
    const firstRow = screen.getByText('Alpha Team').closest('.task-list-row')!;
    const secondRow = screen.getByText('Bravo Team').closest('.task-list-row')!;
    expect(firstRow).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    expect(secondRow).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'ArrowUp' });
    expect(firstRow).toHaveFocus();
  });

  it('shows spinner and disables buttons during pending action', async () => {
    const { user } = renderPopover({
      acceptInvitation: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    await user.click(screen.getByRole('button', { name: 'Accept invitation to Alpha Team' }));
    expect(screen.getByLabelText('Processing')).toBeInTheDocument();
    const rejectBtns = screen.getAllByRole('button', { name: /Reject invitation/ });
    rejectBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows error indicator on failed action', async () => {
    const { user } = renderPopover({
      acceptInvitation: vi.fn().mockRejectedValue(new Error('fail')),
    });
    await user.click(screen.getByRole('button', { name: 'Accept invitation to Alpha Team' }));
    expect(screen.getByText('Failed — retry')).toBeInTheDocument();
  });

  it('announces outcome in ARIA live region', async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole('button', { name: 'Accept invitation to Alpha Team' }));
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('Invitation to Alpha Team accepted');
  });
});
