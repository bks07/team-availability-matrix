import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthResponse } from '../lib/api.models';
import { login, register } from '../services/auth.service';
import { getSelfRegistration } from '../services/settings.service';

type AuthMode = 'login' | 'register';

interface AuthCardProps {
  onAuthSuccess: (session: AuthResponse, mode: AuthMode) => void;
}

interface AuthFormState {
  displayName: string;
  email: string;
  password: string;
}

const INITIAL_FORM: AuthFormState = {
  displayName: '',
  email: '',
  password: ''
};

export default function AuthCard({ onAuthSuccess }: AuthCardProps): JSX.Element {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<AuthFormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selfRegistrationEnabled, setSelfRegistrationEnabled] = useState(false);

  useEffect(() => {
    const loadSelfRegistration = async () => {
      try {
        const response = await getSelfRegistration();
        setSelfRegistrationEnabled(response.enabled);
      } catch {
        setSelfRegistrationEnabled(false);
      }
    };

    void loadSelfRegistration();
  }, []);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authMode === 'register' && !selfRegistrationEnabled) {
      setAuthMode('login');
      setErrorMessage('Self-registration is currently disabled.');
      setSuccessMessage('');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const session =
        authMode === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register({ displayName: form.displayName, email: form.email, password: form.password });

      setForm((prev) => ({ ...prev, password: '' }));
      setSuccessMessage(authMode === 'login' ? 'Welcome back.' : 'Account created successfully.');
      onAuthSuccess(session, authMode);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-tabs">
        <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
          Log in
        </button>
        {selfRegistrationEnabled ? (
          <button
            type="button"
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => setAuthMode('register')}
          >
            Register
          </button>
        ) : null}
      </div>

      <form className="auth-form" onSubmit={submitAuth}>
        {authMode === 'register' && (
          <label>
            <span>Name</span>
            <input
              name="displayName"
              value={form.displayName}
              required
              minLength={2}
              maxLength={80}
              placeholder="Jane Doe"
              onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
            />
          </label>
        )}

        <label>
          <span>Email</span>
          <input
            name="email"
            value={form.email}
            required
            type="email"
            placeholder="jane@example.com"
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            value={form.password}
            required
            type="password"
            minLength={8}
            placeholder="At least 8 characters"
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      {errorMessage && <p className="message error">{errorMessage}</p>}
      {successMessage && <p className="message success">{successMessage}</p>}
    </section>
  );
}
