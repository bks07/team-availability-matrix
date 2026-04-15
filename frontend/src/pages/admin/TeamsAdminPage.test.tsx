import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import type { User } from '../../lib/api.models';
import TeamsAdminPage from './TeamsAdminPage';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

vi.mock('../../services/admin-team.service', () => ({
  adminTeamService: {
    listTeams: vi.fn().mockResolvedValue([
      { id: 1, name: 'Alpha', description: 'Team Alpha', memberCount: 3, createdAt: '2026-01-01T00:00:00Z' },
    ]),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    listMembers: vi.fn().mockResolvedValue([]),
    assignUser: vi.fn(),
    removeUser: vi.fn(),
  },
}));

vi.mock('../../services/team.service', () => ({
  teamService: {
    searchUsers: vi.fn().mockResolvedValue([]),
  },
}));

const mockUser: User = {
  id: 1,
  email: 'admin@test.com',
  displayName: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  permissions: ['teams.view'],
};

function renderPage() {
  return render(
    <AuthContext.Provider
      value={{
        currentUser: mockUser,
        onAuthSuccess: vi.fn(),
        updateSessionUser: vi.fn(),
        onLogout: vi.fn(),
      }}
    >
      <TeamsAdminPage />
    </AuthContext.Provider>,
  );
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByText('Loading teams...')).not.toBeInTheDocument();
  });
}

describe('TeamsAdminPage primary button consolidation', () => {
  it('renders Create Team button with btn btn-primary classes', async () => {
    renderPage();
    await waitForLoaded();
    const btn = screen.getByRole('button', { name: 'Create Team' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
  });

  it('renders Create modal submit with btn btn-primary classes', async () => {
    renderPage();
    await waitForLoaded();
    await userEvent.click(screen.getByRole('button', { name: 'Create Team' }));
    const btn = screen.getByRole('button', { name: 'Create' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
  });

  it('renders Search button in member modal with btn btn-primary classes', async () => {
    renderPage();
    await waitForLoaded();
    const memberBtn = screen.getByRole('button', { name: 'Show members for Alpha' });
    await userEvent.click(memberBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Team members' })).toBeInTheDocument();
    });
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
  });

  it('does not render any element with primary-button class', async () => {
    renderPage();
    await waitForLoaded();
    const elements = document.querySelectorAll('.primary-button');
    expect(elements.length).toBe(0);
  });
});
