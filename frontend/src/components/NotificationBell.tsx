import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { UseNotificationsResult } from '../hooks/useNotifications';
import TaskListPopover from './TaskListPopover';

interface NotificationBellProps {
  notifications: UseNotificationsResult;
}

export default function NotificationBell({ notifications }: NotificationBellProps): JSX.Element {
  const { count, pulseTriggered, clearPulse, refresh } = notifications;
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const displayCount = count > 9 ? '9+' : String(count);

  const handleToggle = useCallback(async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      await refresh();
    }
  }, [isOpen, refresh]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    bellRef.current?.focus();
  }, []);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void handleToggle();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        bellRef.current && !bellRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        bellRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (pulseTriggered) {
      const timer = setTimeout(clearPulse, 600);
      return () => clearTimeout(timer);
    }
  }, [pulseTriggered, clearPulse]);

  return (
    <div className="notification-bell-wrapper">
      <button
        ref={bellRef}
        type="button"
        className={`notification-bell-trigger${pulseTriggered ? ' notification-bell-pulse' : ''}`}
        onClick={() => void handleToggle()}
        onKeyDown={handleKeyDown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={count > 0 ? `Notifications, ${count} pending` : 'Notifications'}
      >
        <svg
          className="notification-bell-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {displayCount}
          </span>
        )}
      </button>
      {isOpen && (
        <TaskListPopover
          ref={popoverRef}
          notifications={notifications}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
