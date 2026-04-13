import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UseNotificationsResult } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';
import { MemoryRouter } from 'react-router-dom';

function createMockNotifications(overrides: Partial<UseNotificationsResult> = {}): UseNotificationsResult {
  return {
    invitations: [],
    count: 0,
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

function renderBell(notifications: UseNotificationsResult) {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <NotificationBell notifications={notifications} />
    </MemoryRouter>
  );
  return { user };
}

describe('NotificationBell', () => {
  it('renders bell button with accessible label', () => {
    renderBell(createMockNotifications());
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('shows badge when count > 0', () => {
    renderBell(createMockNotifications({ count: 3 }));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ when count exceeds 9', () => {
    renderBell(createMockNotifications({ count: 15 }));
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('does not show badge when count is 0', () => {
    renderBell(createMockNotifications({ count: 0 }));
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('toggles popover on click', async () => {
    const mock = createMockNotifications();
    const { user } = renderBell(mock);
    const bell = screen.getByRole('button', { name: 'Notifications' });

    await user.click(bell);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mock.refresh).toHaveBeenCalled();
  });

  it('includes count in aria-label when has notifications', () => {
    renderBell(createMockNotifications({ count: 5 }));
    expect(screen.getByRole('button', { name: 'Notifications, 5 pending' })).toBeInTheDocument();
  });

  it('applies pulse class when pulseTriggered is true', () => {
    renderBell(createMockNotifications({ pulseTriggered: true }));
    const bell = screen.getByRole('button', { name: 'Notifications' });
    expect(bell.className).toContain('notification-bell-pulse');
  });

  it('closes popover on Escape and returns focus to bell', async () => {
    const mock = createMockNotifications();
    const { user } = renderBell(mock);
    const bell = screen.getByRole('button', { name: 'Notifications' });
    await user.click(bell);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(bell).toHaveFocus();
  });

  it('closes popover on click outside', async () => {
    const mock = createMockNotifications();
    const { user } = renderBell(mock);
    const bell = screen.getByRole('button', { name: 'Notifications' });
    await user.click(bell);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens popover with Enter key', () => {
    const mock = createMockNotifications();
    renderBell(mock);
    const bell = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.keyDown(bell, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
