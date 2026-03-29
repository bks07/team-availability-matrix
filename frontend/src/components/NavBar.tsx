import { useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { AuthContext } from '../context/AuthContext';
import BurgerMenu from './BurgerMenu';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function NavBar(): JSX.Element | null {
  const { currentUser, onLogout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!currentUser) {
    return null;
  }

  const hasAdminPermission = currentUser.permissions.includes('admin');

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
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    onLogout();
    setOpen(false);
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
          <nav className="navbar-nav">
            <NavLink to="/workspace" className={({ isActive }) => (isActive ? 'navbar-link active' : 'navbar-link')}>
              Workspace
            </NavLink>
            {hasAdminPermission && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'navbar-link active' : 'navbar-link')}>
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="navbar-right">
          <div className="navbar-user" ref={dropdownRef}>
            <button
              type="button"
              className="navbar-user-trigger"
              onClick={() => setOpen(!open)}
              aria-haspopup="true"
              aria-expanded={open}
            >
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" className="navbar-user-avatar" />
              ) : (
                <span className="navbar-user-initials">{getInitials(currentUser.displayName)}</span>
              )}
              <span className="navbar-user-name">{currentUser.displayName}</span>
              <span className="navbar-user-chevron">▾</span>
            </button>
            {open && (
              <div className="navbar-dropdown" role="menu">
                <Link to="/profile" className="navbar-dropdown-header" onClick={() => setOpen(false)}>
                  {currentUser.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="" className="navbar-dropdown-avatar" />
                  ) : (
                    <span className="navbar-dropdown-initials">{getInitials(currentUser.displayName)}</span>
                  )}
                  <div className="navbar-dropdown-user-info">
                    <span className="navbar-dropdown-user-name">{currentUser.displayName}</span>
                    <span className="navbar-dropdown-user-email">{currentUser.email}</span>
                  </div>
                </Link>

                <div className="navbar-dropdown-separator" />

                <Link to="/profile" className="navbar-dropdown-item" role="menuitem" onClick={() => setOpen(false)}>
                  Profile
                </Link>
                <Link
                  to="/profile#change-password"
                  className="navbar-dropdown-item"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  Change Password
                </Link>

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
