import { useState } from 'react';
import type { FormEvent } from 'react';
import { changePassword } from '../services/profile.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export interface UseChangePasswordPageResult {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (value: string) => void;
  isSaving: boolean;
  error: string;
  success: string;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useChangePasswordPage(): UseChangePasswordPageResult {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation must match.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess(response.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isSaving,
    error,
    success,
    handleSubmit
  };
}
