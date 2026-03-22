import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function MainLayout(): JSX.Element {
  return (
    <div className="main-layout">
      <NavBar />
      <Outlet />
    </div>
  );
}
