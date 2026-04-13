import { forwardRef, useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TeamInvitation } from '../lib/api.models';
import type { UseNotificationsResult } from '../hooks/useNotifications';
import { relativeTime } from '../lib/time.utils';

interface TaskListPopoverProps {
  notifications: UseNotificationsResult;
  onClose: () => void;
}

const TaskListPopover = forwardRef<HTMLDivElement, TaskListPopoverProps>(
  function TaskListPopover({ notifications, onClose }, ref) {
    const { invitations, count, isLoading, error, refresh, acceptInvitation, rejectInvitation } = notifications;
    const navigate = useNavigate();
    const [actionPending, setActionPending] = useState<number | null>(null);
    const [actionError, setActionError] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const focusedRowIndex = useRef<number>(-1);

    const announce = useCallback((message: string) => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    }, []);

    const handleAction = useCallback(async (e: React.MouseEvent, inv: TeamInvitation, action: 'accept' | 'reject') => {
      e.stopPropagation();
      setActionPending(inv.id);
      setActionError(null);
      try {
        if (action === 'accept') {
          await acceptInvitation(inv.id);
          announce(`Invitation to ${inv.teamName} accepted`);
        } else {
          await rejectInvitation(inv.id);
          announce(`Invitation to ${inv.teamName} rejected`);
        }
        setRemovingId(inv.id);
        setTimeout(() => setRemovingId(null), 200);
      } catch {
        setActionError(inv.id);
      } finally {
        setActionPending(null);
      }
    }, [acceptInvitation, rejectInvitation, announce]);

    const handleRowClick = useCallback(() => {
      onClose();
      void navigate('/teams?tab=received');
    }, [navigate, onClose]);

    const handlePopoverKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
      const rows = Array.from(rowRefs.current.values());
      if (rows.length === 0) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          focusedRowIndex.current = Math.min(focusedRowIndex.current + 1, rows.length - 1);
          rows[focusedRowIndex.current]?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          focusedRowIndex.current = Math.max(focusedRowIndex.current - 1, 0);
          rows[focusedRowIndex.current]?.focus();
          break;
        }
        default:
          break;
      }
    }, []);

    useEffect(() => {
      const rows = Array.from(rowRefs.current.values());
      if (rows.length > 0) {
        focusedRowIndex.current = 0;
        rows[0]?.focus();
      }
    }, [invitations]);

    const setRowRef = useCallback((id: number, el: HTMLDivElement | null) => {
      if (el) {
        rowRefs.current.set(id, el);
      } else {
        rowRefs.current.delete(id);
      }
    }, []);

    return (
      <div className="task-list-popover" ref={ref} role="dialog" aria-label="Notifications" onKeyDown={handlePopoverKeyDown}>
        <div className="task-list-header">
          <span className="task-list-title">Notifications</span>
          {count > 0 && <span className="task-list-count">{count}</span>}
        </div>
        <div className="task-list-body">
          {isLoading && invitations.length === 0 && (
            <div className="task-list-loading">Loading...</div>
          )}
          {error && (
            <div className="task-list-error" onClick={() => void refresh()} role="button" tabIndex={0}>
              Could not load notifications. Tap to retry.
            </div>
          )}
          {!error && !isLoading && invitations.length === 0 && (
            <div className="task-list-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l1.5 1.5L14 10" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <p>All caught up — no pending tasks.</p>
            </div>
          )}
          {!error && invitations.map((inv, idx) => (
            <div
              key={inv.id}
              ref={(el) => setRowRef(inv.id, el)}
              className={`task-list-row${removingId === inv.id ? ' task-list-row-removing' : ''}${actionError === inv.id ? ' task-list-row-error' : ''}`}
              role="button"
              tabIndex={idx === 0 ? 0 : -1}
              onClick={handleRowClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick();
                }
              }}
            >
              <span className="task-list-row-icon" aria-hidden="true">✉</span>
              <div className="task-list-row-info">
                <span className="task-list-row-team">{inv.teamName}</span>
                <span className="task-list-row-inviter">Invited by {inv.inviterName}</span>
              </div>
              <span className="task-list-row-time">{relativeTime(inv.createdAt)}</span>
              <div className="task-list-row-actions">
                {actionPending === inv.id ? (
                  <span className="task-list-spinner" aria-label="Processing">⌻</span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="task-list-action-btn task-list-accept"
                      onClick={(e) => void handleAction(e, inv, 'accept')}
                      aria-label={`Accept invitation to ${inv.teamName}`}
                      title="Accept invitation"
                      disabled={actionPending !== null}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="task-list-action-btn task-list-reject"
                      onClick={(e) => void handleAction(e, inv, 'reject')}
                      aria-label={`Reject invitation to ${inv.teamName}`}
                      title="Reject invitation"
                      disabled={actionPending !== null}
                    >
                      ✗
                    </button>
                  </>
                )}
                {actionError === inv.id && <span className="task-list-row-error-text">Failed — retry</span>}
              </div>
            </div>
          ))}
        </div>
        <div ref={liveRegionRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      </div>
    );
  }
);

export default TaskListPopover;
