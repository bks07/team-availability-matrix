import { Navigate, Outlet } from 'react-router-dom';
import { loadSession } from '../lib/storage';

export default function AuthGuard(): JSX.Element {
  if (!loadSession()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
