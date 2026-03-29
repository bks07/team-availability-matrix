import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: string[];
}

type SectionKey = 'workspace' | 'teams' | 'administration';

type NavItem = {
  label: string;
  to: string;
};

function isActivePath(currentPath: string, targetPath: string): boolean {
  if (targetPath === '/workspace') {
    return currentPath === '/workspace';
  }

  if (targetPath === '/my-calendar' || targetPath === '/teams') {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export default function BurgerMenu({ isOpen, onClose, permissions }: BurgerMenuProps): JSX.Element | null {
  const location = useLocation();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const previousPathRef = useRef(location.pathname);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [sectionsOpen, setSectionsOpen] = useState<Record<SectionKey, boolean>>({
    workspace: true,
    teams: true,
    administration: true
  });

  const hasAdminPermission = permissions.includes('admin');
  const hasSuperAdminPermission = permissions.includes('super_admin');

  const workspaceItems: NavItem[] = useMemo(
    () => [
      { label: 'Availability Matrix', to: '/workspace' },
      { label: 'My Calendar', to: '/my-calendar' }
    ],
    []
  );

  const teamsItems: NavItem[] = useMemo(() => [{ label: 'My Teams', to: '/teams' }], []);

  const administrationItems: NavItem[] = useMemo(() => {
    if (!hasAdminPermission) {
      return [];
    }

    const items: NavItem[] = [
      { label: 'Locations', to: '/admin/locations' },
      { label: 'Public Holidays', to: '/admin/public-holidays' },
      { label: 'Users', to: '/admin/users' }
    ];

    if (hasSuperAdminPermission) {
      items.push({ label: 'Permissions', to: '/admin/permissions' });
      items.push({ label: 'Settings', to: '/admin/settings' });
    }

    return items;
  }, [hasAdminPermission, hasSuperAdminPermission]);

  const shouldShowAdministration = administrationItems.length > 0;

  const sectionHasActiveLink = useMemo(
    () => ({
      workspace: workspaceItems.some((item) => isActivePath(location.pathname, item.to)),
      teams: teamsItems.some((item) => isActivePath(location.pathname, item.to)),
      administration: administrationItems.some((item) => isActivePath(location.pathname, item.to))
    }),
    [location.pathname, workspaceItems, teamsItems, administrationItems]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSectionsOpen({
      workspace: true,
      teams: true,
      administration: shouldShowAdministration
    });
  }, [isOpen, shouldShowAdministration]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSectionsOpen((prev) => ({
      workspace: prev.workspace || sectionHasActiveLink.workspace,
      teams: prev.teams || sectionHasActiveLink.teams,
      administration: prev.administration || sectionHasActiveLink.administration
    }));
  }, [isOpen, sectionHasActiveLink]);

  useEffect(() => {
    if (!isOpen) {
      previousPathRef.current = location.pathname;
      return;
    }

    if (previousPathRef.current !== location.pathname) {
      onClose();
    }

    previousPathRef.current = location.pathname;
  }, [isOpen, location.pathname, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        returnFocusRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const firstFocusable =
      panel?.querySelector<HTMLElement>('[data-burger-focusable="true"]') ?? closeButtonRef.current;

    firstFocusable?.focus();
  }, [isOpen]);

  const getFocusableElements = (): HTMLElement[] => {
    const panel = panelRef.current;
    if (!panel) {
      return [];
    }

    return Array.from(panel.querySelectorAll<HTMLElement>('[data-burger-focusable="true"]'));
  };

  const moveFocusBy = (step: 1 | -1) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      return;
    }

    const currentIndex = focusableElements.findIndex((element) => element === document.activeElement);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + step + focusableElements.length) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  };

  const toggleSection = (section: SectionKey) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!isOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocusBy(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocusBy(-1);
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const interactiveTarget = target.closest<HTMLElement>('[data-burger-focusable="true"]');
    if (!interactiveTarget) {
      return;
    }

    const focusRole = interactiveTarget.getAttribute('data-burger-role');
    if (focusRole === 'section-header' || (focusRole === 'link' && event.key === ' ')) {
      event.preventDefault();
      interactiveTarget.click();
    }
  };

  const renderSection = (
    section: SectionKey,
    title: string,
    items: NavItem[],
    isVisible: boolean = true
  ): JSX.Element | null => {
    if (!isVisible || items.length === 0) {
      return null;
    }

    const expanded = sectionsOpen[section];

    return (
      <div className="burger-section">
        <button
          type="button"
          className="burger-section-header"
          onClick={() => toggleSection(section)}
          aria-expanded={expanded}
          data-burger-focusable="true"
          data-burger-role="section-header"
        >
          <span>{title}</span>
          <span className={`burger-section-chevron${expanded ? '' : ' collapsed'}`} aria-hidden="true">
            ▾
          </span>
        </button>
        {expanded &&
          items.map((item) => {
            const active = isActivePath(location.pathname, item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`burger-link${active ? ' active' : ''}`}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                data-burger-focusable="true"
                data-burger-role="link"
              >
                {item.label}
              </Link>
            );
          })}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="burger-overlay" onClick={onClose} aria-hidden="true" />
      <aside
        id="burger-menu"
        ref={panelRef}
        className="burger-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        onKeyDown={handlePanelKeyDown}
      >
        <div className="burger-panel-header">
          <Link to="/workspace" onClick={onClose} data-burger-focusable="true" data-burger-role="link">
            <img src={logo} alt="Availability Matrix" />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            className="burger-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
            data-burger-focusable="true"
            data-burger-role="close"
          >
            ✕
          </button>
        </div>

        <nav className="burger-nav" aria-label="Main navigation">
          {renderSection('workspace', 'Workspace', workspaceItems)}
          {renderSection('teams', 'Teams', teamsItems)}
          {renderSection('administration', 'Administration', administrationItems, shouldShowAdministration)}
        </nav>
      </aside>
    </>
  );
}
