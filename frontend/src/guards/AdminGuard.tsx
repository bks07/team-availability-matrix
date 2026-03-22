import { Link, Outlet } from 'react-router-dom';
import { loadSession } from '../lib/storage';

export default function AdminGuard(): JSX.Element {
  const session = loadSession();
  const hasAdminPermission = session?.user.permissions.includes('admin') ?? false;

  if (!hasAdminPermission) {
    return (
      <section className="guard-message">
        <h2>403 - Access denied</h2>
        <p>You do not have permission to view administration pages.</p>
        <Link to="/workspace">Return to workspace</Link>
      </section>
    );
  }

  return <Outlet />;
}
