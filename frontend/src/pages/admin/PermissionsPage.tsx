import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PermissionsPage(): JSX.Element {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.permissions.includes('super_admin') ?? false;

  if (!isSuperAdmin) {
    return (
      <section className="guard-message">
        <h2>403 - Access denied</h2>
        <p>Only super administrators can access permission management.</p>
        <Link to="/admin/locations">Return to admin dashboard</Link>
      </section>
    );
  }

  return (
    <section>
      <h2>Permission Management</h2>
      <p>Coming soon.</p>
    </section>
  );
}
