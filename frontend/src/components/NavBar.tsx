import { useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { AuthContext } from '../context/AuthContext';
import type { AvailabilityValue } from '../lib/api.models';
import { getInitials } from '../lib/name.utils';
import { getMatrix, updateStatus } from '../services/matrix.service';
import BurgerMenu from './BurgerMenu';

export default function NavBar(): JSX.Element | null {
  const { currentUser, onLogout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light'
  );
  const [todayStatus, setTodayStatus] = useState<AvailabilityValue | null>(null);
  const [todayDefault, setTodayDefault] = useState<AvailabilityValue>('W');
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayFetched, setTodayFetched] = useState(false);
  const [photoUpdatedAt, setPhotoUpdatedAt] = useState<number>(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!currentUser) {
    return null;
  }


  const photoSrc = useMemo(() => {
    if (!currentUser.photoUrl) {
      return null;
    }

    const separator = currentUser.photoUrl.includes('?') ? '&' : '?';
    return `${currentUser.photoUrl}${separator}t=${photoUpdatedAt}`;
  }, [currentUser.photoUrl, photoUpdatedAt]);

  useEffect(() => {
    setPhotoUpdatedAt(Date.now());
  }, [currentUser.photoUrl]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const getFocusableDropdownItems = useCallback((): HTMLElement[] => {
    const dropdown = dropdownRef.current;
    if (!dropdown) {
      return [];
    }

    return Array.from(
      dropdown.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])')
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      const focusableItems = getFocusableDropdownItems();
      focusableItems[0]?.focus();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [open, getFocusableDropdownItems]);

  const handleDropdownKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const focusableItems = getFocusableDropdownItems();
    if (focusableItems.length === 0) {
      return;
    }

    const currentIndex = focusableItems.indexOf(document.activeElement as HTMLElement);
    const lastIndex = focusableItems.length - 1;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % focusableItems.length : 0;
        focusableItems[nextIndex]?.focus();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const previousIndex = currentIndex >= 0 ? (currentIndex - 1 + focusableItems.length) % focusableItems.length : lastIndex;
        focusableItems[previousIndex]?.focus();
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusableItems[0]?.focus();
        break;
      }
      case 'End': {
        event.preventDefault();
        focusableItems[lastIndex]?.focus();
        break;
      }
      case 'Tab': {
        if (event.shiftKey && currentIndex === 0) {
          event.preventDefault();
          focusableItems[lastIndex]?.focus();
        } else if (!event.shiftKey && currentIndex === lastIndex) {
          event.preventDefault();
          focusableItems[0]?.focus();
        }
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!open || todayFetched || !currentUser) {
      return;
    }

    const fetchToday = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const todayStr = now.toISOString().slice(0, 10);
        const data = await getMatrix(year);

        const entry = data.entries.find((entryItem) => entryItem.userId === currentUser.id && entryItem.statusDate === todayStr);
        setTodayStatus(entry?.status ?? null);

        const schedule = data.workSchedules.find((scheduleItem) => scheduleItem.userId === currentUser.id);
        if (schedule) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
          const dayKey = dayNames[now.getDay()];
          const isWorkDay = schedule[dayKey];
          setTodayDefault(isWorkDay ? 'W' : 'A');
        }

        setTodayFetched(true);
      } catch {
        setTodayFetched(true);
      }
    };

    void fetchToday();
  }, [open, todayFetched, currentUser]);

  const handleLogout = () => {
    onLogout();
    setOpen(false);
  };

  const handleTodayStatus = async (status: AvailabilityValue) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const prevStatus = todayStatus;

    setTodayStatus(status);
    setTodayLoading(true);

    try {
      await updateStatus(todayStr, status);
    } catch {
      setTodayStatus(prevStatus);
    } finally {
      setTodayLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('availability-matrix.theme', newTheme);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <button
            type="button"
            className="burger-menu-trigger"
            onClick={() => setBurgerOpen(!burgerOpen)}
            aria-label="Navigation menu"
            aria-expanded={burgerOpen}
            aria-controls="burger-menu"
          >
            ☰
          </button>
          <Link to="/workspace" className="navbar-logo">
            <img src={logo} alt="Availability Matrix" height="32" />
          </Link>
        </div>

        <div className="navbar-right">
          <div className="navbar-user" ref={dropdownRef}>
            <button
              ref={triggerRef}
              type="button"
              className="navbar-user-trigger"
              onClick={() => setOpen(!open)}
              aria-haspopup="true"
              aria-expanded={open}
            >
              {photoSrc ? (
                <img src={photoSrc} alt="" className="navbar-user-avatar" />
              ) : (
                <span className="navbar-user-initials">{getInitials(currentUser)}</span>
              )}
              <span className="navbar-user-name">{currentUser.displayName}</span>
              <span className="navbar-user-chevron">▾</span>
            </button>
            {open && (
              <div className="navbar-dropdown" role="menu" onKeyDown={handleDropdownKeyDown}>
                <Link to="/profile" className="navbar-dropdown-header" onClick={() => setOpen(false)}>
                  {photoSrc ? (
                    <img src={photoSrc} alt="" className="navbar-dropdown-avatar" />
                  ) : (
                    <span className="navbar-dropdown-initials">{getInitials(currentUser)}</span>
                  )}
                  <div className="navbar-dropdown-user-info">
                    <span className="navbar-dropdown-user-name">{currentUser.displayName}</span>
                    <span className="navbar-dropdown-user-email">{currentUser.email}</span>
                  </div>
                </Link>

                <div className="navbar-dropdown-separator" />

                <div className="navbar-today-section" onClick={(event) => event.stopPropagation()}>
                  <div className="navbar-today-header">
                    <span className="navbar-today-label">Today</span>
                    <span className="navbar-today-date">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="navbar-status-group" role="group" aria-label="Today's Status">
                    {(['W', 'V', 'A'] as AvailabilityValue[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`navbar-status-btn status-${status.toLowerCase()}${(todayStatus ?? todayDefault) === status ? ' active' : ''}`}
                        disabled={todayLoading}
                        aria-pressed={(todayStatus ?? todayDefault) === status}
                        onClick={() => handleTodayStatus(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  {todayStatus && todayStatus !== todayDefault && (
                    <div className="navbar-today-hint">Overrides default ({todayDefault})</div>
                  )}
                </div>

                <div className="navbar-dropdown-separator" />

                <Link
                  to="/change-password"
                  className="navbar-dropdown-item"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Change Password
                </Link>

                <div className="navbar-theme-toggle" onClick={(event) => event.stopPropagation()}>
                  <span className="navbar-theme-label">Theme</span>
                  <div className="navbar-theme-switch">
                    <button
                      type="button"
                      className={`navbar-theme-btn${theme === 'light' ? ' active' : ''}`}
                      onClick={() => handleThemeChange('light')}
                      aria-pressed={theme === 'light'}
                    >
                      ☀️ Light
                    </button>
                    <button
                      type="button"
                      className={`navbar-theme-btn${theme === 'dark' ? ' active' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                      aria-pressed={theme === 'dark'}
                    >
                      🌙 Dark
                    </button>
                  </div>
                </div>

                <div className="navbar-dropdown-separator" />

                <button
                  type="button"
                  className="navbar-dropdown-item logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <BurgerMenu isOpen={burgerOpen} onClose={() => setBurgerOpen(false)} permissions={currentUser.permissions} />
    </>
  );
}
