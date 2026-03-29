import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar(): JSX.Element {
  const { currentUser } = useAuth();
  const hasAdminPermission = currentUser?.permissions.includes('admin') ?? false;
  const isSuperAdmin = currentUser?.permissions.includes('super_admin') ?? false;

  return (
    <aside className="admin-sidebar">
      <NavLink to="/admin/locations">Locations</NavLink>
      <NavLink to="/admin/public-holidays">Public Holidays</NavLink>
      {hasAdminPermission && <NavLink to="/admin/users">Users</NavLink>}
      {isSuperAdmin && <NavLink to="/admin/permissions">Permissions</NavLink>}
      {isSuperAdmin && <NavLink to="/admin/settings">Settings</NavLink>}
    </aside>
  );
}
