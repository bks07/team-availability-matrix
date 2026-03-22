import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar(): JSX.Element | null {
  const navigate = useNavigate();
  const { currentUser, onLogout } = useAuth();

  if (!currentUser) {
    return null;
  }

  const hasAdminPermission = currentUser.permissions.includes('admin');

  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="app-navbar" aria-label="Main Navigation">
      <Link to="/workspace">Availability Matrix</Link>
      <div className="nav-links">
        <NavLink to="/workspace">Workspace</NavLink>
        {hasAdminPermission && <NavLink to="/admin/locations">Admin</NavLink>}
      </div>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}
