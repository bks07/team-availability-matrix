import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import type { User } from '../../lib/api.models';
import PermissionsPage from './PermissionsPage';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

vi.mock('../../services/permission.service', () => ({
  getPermissionProfiles: vi.fn().mockResolvedValue([]),
  getPermissionCatalog: vi.fn().mockResolvedValue([]),
  getAdminUsers: vi.fn().mockResolvedValue([]),
  getUsageReport: vi.fn().mockResolvedValue([]),
  getAuditLog: vi.fn().mockResolvedValue({ entries: [], total: 0, page: 1, pageSize: 25 }),
  createPermissionProfile: vi.fn(),
  updatePermissionProfile: vi.fn(),
  deletePermissionProfile: vi.fn(),
  assignUserProfile: vi.fn(),
  getUsageReportCsvUrl: vi.fn().mockReturnValue('/admin/permission-usage-report/csv'),
  getAuditLogCsvUrl: vi.fn().mockReturnValue('/admin/permission-audit-log/csv'),
}));

vi.mock('../../lib/storage', () => ({
  currentToken: vi.fn().mockReturnValue('fake-token'),
}));

vi.mock('../../lib/api.config', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
}));

const mockUser: User = {
  id: 1,
  email: 'admin@test.com',
  displayName: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  permissions: ['permission_profiles.view'],
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
      <PermissionsPage />
    </AuthContext.Provider>,
  );
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
}

function assertIconButton(button: HTMLElement) {
  expect(button).toHaveClass('icon-btn');
  expect(button.querySelector('svg')).toBeInTheDocument();
}

describe('PermissionsPage icon buttons', () => {
  describe('User Assignments tab', () => {
    it('renders Clear Filters as an icon button', async () => {
      renderPage();
      await waitForLoaded();

      await userEvent.click(screen.getByRole('button', { name: 'User Assignments' }));

      const btn = screen.getByRole('button', { name: 'Clear Filters' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Clear Filters');
    });
  });

  describe('Usage Report tab', () => {
    beforeEach(async () => {
      renderPage();
      await waitForLoaded();
      await userEvent.click(screen.getByRole('button', { name: 'Usage Report' }));
    });

    it('renders Apply Filters as an icon button', () => {
      const btn = screen.getByRole('button', { name: 'Apply Filters' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Apply Filters');
    });

    it('renders Clear Filters as an icon button', () => {
      const btn = screen.getByRole('button', { name: 'Clear Filters' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Clear Filters');
    });

    it('renders Download CSV as an icon button', () => {
      const btn = screen.getByRole('button', { name: 'Download CSV' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Download CSV');
    });
  });

  describe('Audit Log tab', () => {
    beforeEach(async () => {
      renderPage();
      await waitForLoaded();
      await userEvent.click(screen.getByRole('button', { name: 'Audit Log' }));
    });

    it('renders Apply Filters as an icon button', () => {
      const btn = screen.getByRole('button', { name: 'Apply Filters' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Apply Filters');
    });

    it('renders Clear Filters as an icon button', () => {
      const btn = screen.getByRole('button', { name: 'Clear Filters' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Clear Filters');
    });

    it('renders Download CSV as an icon button', () => {
      const btn = screen.getByRole('button', { name: 'Download CSV' });
      assertIconButton(btn);
      expect(btn).toHaveAttribute('title', 'Download CSV');
    });
  });
});

describe('PermissionsPage primary button consolidation', () => {
  it('renders New Profile button with btn btn-primary classes', async () => {
    renderPage();
    await waitForLoaded();
    const btn = screen.getByRole('button', { name: 'New Profile' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
  });

  it('renders Create button in profile modal with btn btn-primary classes', async () => {
    renderPage();
    await waitForLoaded();
    await userEvent.click(screen.getByRole('button', { name: 'New Profile' }));
    const btn = screen.getByRole('button', { name: 'Create' });
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
