import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSelfRegistration, updateSelfRegistration } from '../../services/settings.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function SettingsPage(): JSX.Element {
  const { currentUser } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSuperAdmin = currentUser?.permissions.includes('super_admin') ?? false;

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    const loadSetting = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getSelfRegistration();
        setEnabled(response.enabled);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadSetting();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <section className="guard-message">
        <h2>403 - Access denied</h2>
        <p>Only super administrators can access settings.</p>
        <Link to="/admin/locations">Return to admin dashboard</Link>
      </section>
    );
  }

  const handleToggle = async (nextEnabled: boolean) => {
    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateSelfRegistration(nextEnabled);
      setEnabled(updated.enabled);
      setSuccess('Settings updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="admin-management">
      <h2>Settings</h2>

      <div aria-live="polite">
        {success ? <p className="admin-alert success">{success}</p> : null}
        {error ? <p className="admin-alert error">{error}</p> : null}
      </div>

      {loading ? (
        <p className="message">Loading settings...</p>
      ) : (
        <div className="entity-row" style={{ border: '1px solid var(--border-light)', borderRadius: '0.375rem' }}>
          <div>
            <p className="entity-name" style={{ marginBottom: '0.25rem', fontWeight: 600 }}>
              Self-Registration
            </p>
            <p className="message">Allow new users to register themselves</p>
          </div>
          <div className="entity-actions">
            <label>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => void handleToggle(event.target.checked)}
                disabled={isMutating}
              />{' '}
              Enabled
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
