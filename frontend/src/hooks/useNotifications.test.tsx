import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { TeamInvitation } from '../lib/api.models';
import { teamService } from '../services/team.service';
import { useNotifications } from './useNotifications';
import React from 'react';
import { AuthContext } from '../context/AuthContext';

vi.mock('../services/team.service', () => ({
  teamService: {
    getMyInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  email: 'test@test.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  permissions: [],
};

const inv1: TeamInvitation = { id: 1, teamId: 10, teamName: 'Alpha', inviterName: 'Alice', status: 'pending', createdAt: '2026-04-13T10:00:00Z' };
const inv2: TeamInvitation = { id: 2, teamId: 20, teamName: 'Bravo', inviterName: 'Bob', status: 'pending', createdAt: '2026-04-13T08:00:00Z' };
const inv3: TeamInvitation = { id: 3, teamId: 30, teamName: 'Charlie', inviterName: 'Carol', status: 'accepted', createdAt: '2026-04-13T06:00:00Z' };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={{ currentUser: mockUser, onAuthSuccess: vi.fn(), updateSessionUser: vi.fn(), onLogout: vi.fn() }}>
    {children}
  </AuthContext.Provider>
);

describe('useNotifications', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.mocked(teamService.getMyInvitations).mockResolvedValue([inv1, inv2, inv3]);
    vi.mocked(teamService.acceptInvitation).mockResolvedValue(inv1);
    vi.mocked(teamService.rejectInvitation).mockResolvedValue(inv1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches and filters pending invitations', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.count).toBe(2);
    expect(result.current.invitations.map((i) => i.id)).toEqual([1, 2]);
  });

  it('sorts by createdAt descending', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const times = result.current.invitations.map((i) => new Date(i.createdAt).getTime());
    expect(times[0]).toBeGreaterThan(times[1]);
  });

  it('optimistically removes on accept', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await result.current.acceptInvitation(1);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.invitations.map((i) => i.id)).toEqual([2]);
  });

  it('rolls back on accept failure', async () => {
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await expect(act(async () => {
      await result.current.acceptInvitation(1);
    })).rejects.toThrow('fail');

    expect(result.current.count).toBe(2);
  });

  it('handles fetch error', async () => {
    vi.mocked(teamService.getMyInvitations).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.error).toBe('network');
    expect(result.current.count).toBe(0);
  });

  it('triggers pulse on zero-to-positive transition', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.pulseTriggered).toBe(true);
  });

  it('optimistically removes on reject', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await result.current.rejectInvitation(1); });
    expect(result.current.count).toBe(1);
    expect(result.current.invitations.map((i) => i.id)).toEqual([2]);
  });

  it('rolls back on reject failure', async () => {
    vi.mocked(teamService.rejectInvitation).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await expect(act(async () => {
      await result.current.rejectInvitation(1);
    })).rejects.toThrow('fail');
    expect(result.current.count).toBe(2);
  });

  it('polls every 60 seconds', async () => {
    renderHook(() => useNotifications(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(teamService.getMyInvitations).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(teamService.getMyInvitations).toHaveBeenCalledTimes(2);
  });
});
