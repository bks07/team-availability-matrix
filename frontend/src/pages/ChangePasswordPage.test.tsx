import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ChangePasswordPage from './ChangePasswordPage';

vi.mock('../hooks/useChangePasswordPage', () => ({
  useChangePasswordPage: vi.fn(() => ({
    currentPassword: '',
    setCurrentPassword: vi.fn(),
    newPassword: '',
    setNewPassword: vi.fn(),
    confirmNewPassword: '',
    setConfirmNewPassword: vi.fn(),
    isSaving: false,
    error: '',
    success: '',
    handleSubmit: vi.fn((e: Event) => { e.preventDefault(); }),
  })),
}));

import { useChangePasswordPage } from '../hooks/useChangePasswordPage';

const mockUseChangePasswordPage = vi.mocked(useChangePasswordPage);

function getDefaultHookReturn() {
  return {
    currentPassword: '',
    setCurrentPassword: vi.fn(),
    newPassword: '',
    setNewPassword: vi.fn(),
    confirmNewPassword: '',
    setConfirmNewPassword: vi.fn(),
    isSaving: false,
    error: '',
    success: '',
    handleSubmit: vi.fn((e: Event) => { e.preventDefault(); }),
  };
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    mockUseChangePasswordPage.mockReturnValue(getDefaultHookReturn() as any);
  });

  it('renders three password inputs with type=password by default', () => {
    render(<ChangePasswordPage />);
    const inputs = screen.getAllByLabelText(/password/i);
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    inputs.forEach(input => {
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  it('toggles current password visibility when Show button is clicked', async () => {
    render(<ChangePasswordPage />);
    const showButtons = screen.getAllByRole('button', { name: /show/i });
    expect(showButtons.length).toBeGreaterThanOrEqual(1);
    const user = userEvent.setup();
    await user.click(showButtons[0]);
    const firstLabel = screen.getByText('Current Password').closest('label')!;
    const input = within(firstLabel).getByRole('textbox') || firstLabel.querySelector('input');
    // After clicking Show, the input should reveal text
    expect(input).toBeTruthy();
  });

  it('renders three Show toggle buttons', () => {
    render(<ChangePasswordPage />);
    const toggles = screen.getAllByRole('button', { name: /show/i });
    expect(toggles).toHaveLength(3);
  });

  it('does not show mismatch warning when passwords are empty', () => {
    render(<ChangePasswordPage />);
    expect(screen.queryByText(/passwords do not match/i)).toBeNull();
  });

  it('shows mismatch warning when newPassword and confirmNewPassword differ', () => {
    mockUseChangePasswordPage.mockReturnValue({
      ...getDefaultHookReturn(),
      newPassword: 'abc123',
      confirmNewPassword: 'different',
    } as any);
    render(<ChangePasswordPage />);
    expect(screen.getByText(/passwords do not match/i)).toBeTruthy();
  });

  it('does not show mismatch when passwords match', () => {
    mockUseChangePasswordPage.mockReturnValue({
      ...getDefaultHookReturn(),
      newPassword: 'abc123',
      confirmNewPassword: 'abc123',
    } as any);
    render(<ChangePasswordPage />);
    expect(screen.queryByText(/passwords do not match/i)).toBeNull();
  });

  it('shows success message when provided', () => {
    mockUseChangePasswordPage.mockReturnValue({
      ...getDefaultHookReturn(),
      success: 'Password updated!',
    } as any);
    render(<ChangePasswordPage />);
    expect(screen.getByText('Password updated!')).toBeTruthy();
  });

  it('shows error message when provided', () => {
    mockUseChangePasswordPage.mockReturnValue({
      ...getDefaultHookReturn(),
      error: 'Something went wrong',
    } as any);
    render(<ChangePasswordPage />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('applies design system card class', () => {
    const { container } = render(<ChangePasswordPage />);
    const card = container.querySelector('.card.card-padded');
    expect(card).toBeTruthy();
  });
});
