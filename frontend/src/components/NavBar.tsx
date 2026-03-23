import { useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { AuthContext } from '../context/AuthContext';

export default function NavBar(): JSX.Element | null {
  const { currentUser, onLogout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
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
    <header className="navbar">
      <div className="navbar-left">
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
            {currentUser.displayName} ▾
          </button>
          {open && (
            <div className="navbar-dropdown" role="menu">
              <button type="button" className="navbar-dropdown-item" role="menuitem" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
