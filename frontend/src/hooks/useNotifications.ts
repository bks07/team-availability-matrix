import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { TeamInvitation } from '../lib/api.models';
import { teamService } from '../services/team.service';

const POLL_INTERVAL_MS = 60_000;

export interface UseNotificationsResult {
  invitations: TeamInvitation[];
  count: number;
  isLoading: boolean;
  error: string | null;
  pulseTriggered: boolean;
  clearPulse: () => void;
  refresh: () => Promise<void>;
  acceptInvitation: (id: number) => Promise<void>;
  rejectInvitation: (id: number) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { currentUser } = useContext(AuthContext);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseTriggered, setPulseTriggered] = useState(false);
  const prevCountRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchInvitations = useCallback(async (showLoading = false) => {
    if (!currentUser) return;
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await teamService.getMyInvitations();
      if (!mountedRef.current) return;
      const pending = data
        .filter((inv) => inv.status.toLowerCase() === 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const newCount = pending.length;
      if (prevCountRef.current === 0 && newCount > 0) {
        setPulseTriggered(true);
      }
      prevCountRef.current = newCount;
      setInvitations(pending);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [currentUser]);

  const refresh = useCallback(async () => {
    await fetchInvitations(false);
  }, [fetchInvitations]);

  const clearPulse = useCallback(() => {
    setPulseTriggered(false);
  }, []);

  const acceptInv = useCallback(async (id: number) => {
    const prev = invitations;
    setInvitations((current) => current.filter((inv) => inv.id !== id));
    prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    try {
      await teamService.acceptInvitation(id);
    } catch (err) {
      setInvitations(prev);
      prevCountRef.current = prev.length;
      throw err;
    }
  }, [invitations]);

  const rejectInv = useCallback(async (id: number) => {
    const prev = invitations;
    setInvitations((current) => current.filter((inv) => inv.id !== id));
    prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    try {
      await teamService.rejectInvitation(id);
    } catch (err) {
      setInvitations(prev);
      prevCountRef.current = prev.length;
      throw err;
    }
  }, [invitations]);

  useEffect(() => {
    mountedRef.current = true;
    if (currentUser) {
      void fetchInvitations(true);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [currentUser, fetchInvitations]);

  useEffect(() => {
    if (!currentUser) return;
    intervalRef.current = setInterval(() => {
      void fetchInvitations(false);
    }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentUser, fetchInvitations]);

  return {
    invitations,
    count: invitations.length,
    isLoading,
    error,
    pulseTriggered,
    clearPulse,
    refresh,
    acceptInvitation: acceptInv,
    rejectInvitation: rejectInv,
  };
}
