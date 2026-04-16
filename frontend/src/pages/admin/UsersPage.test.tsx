import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UsersPage from './UsersPage';

const mockUseUsersPage = {
  currentUser: { id: 1, email: 'admin@test.com', displayName: 'Admin', permissions: [] },
  users: [{ id: 2, email: 'user@test.com', displayName: 'Test User', locationId: null }],
  filteredUsers: [{ id: 2, email: 'user@test.com', displayName: 'Test User', locationId: null }],
  workSchedules: new Map(),
  locations: [],
  searchQuery: '',
  setSearchQuery: vi.fn(),
  filterLocationId: null,
  setFilterLocationId: vi.fn(),
  isCreateModalOpen: false,
  setIsCreateModalOpen: vi.fn(),
  newUserForm: { title: '', email: '', firstName: '', middleName: '', lastName: '', password: '', locationId: null },
  setNewUserForm: vi.fn(),
  editModalUserId: null as number | null,
  passwordModalUserId: null as number | null,
  editUserForm: { title: '', email: '', firstName: '', middleName: '', lastName: '', locationId: null },
  setEditUserForm: vi.fn(),
  passwordForm: { password: '', confirmPassword: '' },
  setPasswordForm: vi.fn(),
  scheduleForm: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false, hoursPerWeek: '40', ignoreWeekends: true, ignorePublicHolidays: false },
  setScheduleForm: vi.fn(),
  scheduleLoading: false,
  loading: false,
  isMutating: false,
  isBulkAssigning: false,
  error: '',
  success: '',
  selectedUserIds: new Set(),
  bulkLocationValue: '',
  setBulkLocationValue: vi.fn(),
  selectionAnnouncement: '',
  selectAllCheckboxRef: { current: null },
  locationNameById: new Map(),
  selectedCount: 0,
  allSelected: false,
  toggleUserSelection: vi.fn(),
  clearSelection: vi.fn(),
  toggleSelectAll: vi.fn(),
  handleBulkAssign: vi.fn(),
  handleCreateUser: vi.fn(),
  openEditModal: vi.fn(),
  closeEditModal: vi.fn(),
  openPasswordModal: vi.fn(),
  closePasswordModal: vi.fn(),
  handleSaveEdit: vi.fn(),
  handleChangePassword: vi.fn(),
  handleDelete: vi.fn(),
};

vi.mock('../../hooks/useUsersPage', () => ({
  useUsersPage: () => mockUseUsersPage,
}));

function renderPage() {
  return render(<UsersPage />);
}

describe('UsersPage primary button consolidation', () => {
  it('renders Create User button with btn btn-primary classes', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: 'Create User' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
  });

  it('renders Create modal submit with btn btn-primary classes', () => {
    mockUseUsersPage.isCreateModalOpen = true;
    renderPage();
    const btn = screen.getByRole('button', { name: 'Create' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
    mockUseUsersPage.isCreateModalOpen = false;
  });

  it('renders Edit modal Save button with btn btn-primary classes', () => {
    mockUseUsersPage.editModalUserId = 2;
    renderPage();
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
    mockUseUsersPage.editModalUserId = null;
  });

  it('renders Change Password modal submit with btn btn-primary classes', () => {
    mockUseUsersPage.passwordModalUserId = 2;
    renderPage();
    const btn = screen.getByRole('button', { name: 'Change Password' });
    expect(btn).toHaveClass('btn', 'btn-primary');
    expect(btn).not.toHaveClass('primary-button');
    mockUseUsersPage.passwordModalUserId = null;
  });

  it('does not render any element with primary-button class', () => {
    renderPage();
    const elements = document.querySelectorAll('.primary-button');
    expect(elements.length).toBe(0);
  });
});
