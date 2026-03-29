import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import AdminGuard from './guards/AdminGuard';
import AuthGuard from './guards/AuthGuard';
import AdminLayout from './layouts/AdminLayout';
import MainLayout from './layouts/MainLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import type { AuthResponse, User } from './lib/api.models';
import { clearSession, loadSession, saveSession } from './lib/storage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import HolidaysPage from './pages/admin/HolidaysPage';
import LocationsPage from './pages/admin/LocationsPage';
import PermissionsPage from './pages/admin/PermissionsPage';
import SettingsPage from './pages/admin/SettingsPage';
import UsersPage from './pages/admin/UsersPage';
import { me } from './services/auth.service';

export default function App(): JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const session = loadSession();
      if (!session) {
        setBootLoading(false);
        return;
      }

      try {
        const user = await me();
        saveSession({ ...session, user });
        setCurrentUser(user);
      } catch {
        clearSession();
      } finally {
        setBootLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleAuthSuccess = (session: AuthResponse, _mode: 'login' | 'register') => {
    saveSession(session);
    setCurrentUser(session.user);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const authContextValue = useMemo(
    () => ({
      currentUser,
      onAuthSuccess: handleAuthSuccess,
      onLogout: handleLogout
    }),
    [currentUser]
  );

  if (bootLoading) {
    return (
      <main className="page-shell">
        <p className="message">Loading...</p>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/workspace" replace />} />
              <Route path="/workspace" element={<WorkspaceLayout />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Navigate to="/admin/locations" replace />} />
                  <Route path="/admin/locations" element={<LocationsPage />} />
                  <Route path="/admin/public-holidays" element={<HolidaysPage />} />
                  <Route path="/admin/users" element={<UsersPage />} />
                  <Route path="/admin/permissions" element={<PermissionsPage />} />
                  <Route path="/admin/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
