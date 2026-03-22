import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import HeroCard from '../components/HeroCard';
import type { AuthResponse } from '../lib/api.models';
import { loadSession } from '../lib/storage';

interface LoginPageProps {
  onAuthSuccess: (session: AuthResponse, mode: 'login' | 'register') => void;
}

export default function LoginPage({ onAuthSuccess }: LoginPageProps): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    if (loadSession()) {
      navigate('/workspace', { replace: true });
    }
  }, [navigate]);

  const handleAuthSuccess = (session: AuthResponse, mode: 'login' | 'register') => {
    onAuthSuccess(session, mode);
    navigate('/workspace', { replace: true });
  };

  return (
    <main className="page-shell">
      <HeroCard />
      <AuthCard onAuthSuccess={handleAuthSuccess} />
    </main>
  );
}
