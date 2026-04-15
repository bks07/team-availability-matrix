import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import logo from '../assets/logo.svg';
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
    <main className="login-screen">
      <div className="login-branding login-entrance">
        <img src={logo} alt="Availability Matrix" className="login-logo" />
        <h1 className="login-title">Team Availability Matrix</h1>
        <p className="login-tagline">Your team’s availability at a glance</p>
      </div>
      <div className="login-entrance login-entrance-delay">
        <AuthCard onAuthSuccess={handleAuthSuccess} />
      </div>
    </main>
  );
}
