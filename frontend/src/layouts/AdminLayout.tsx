import { Outlet } from 'react-router-dom';

export default function AdminLayout(): JSX.Element {
  return (
    <main className="admin-layout-container">
      <Outlet />
    </main>
  );
}
