import { useState } from 'react';
import { useChangePasswordPage } from '../hooks/useChangePasswordPage';

export default function ChangePasswordPage(): JSX.Element {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isSaving,
    error,
    success,
    handleSubmit
  } = useChangePasswordPage();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch = newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  return (
    <main className="page-shell profile-layout">
      <section className="profile-card card card-padded">
        <h2>Change Password</h2>

        <div aria-live="polite">
          {success ? <p className="alert alert-success">{success}</p> : null}
          {error ? <p className="alert alert-error">{error}</p> : null}
        </div>

        <form className="profile-form password-form" onSubmit={handleSubmit}>
          <label>
            Current Password
            <div className="pw-field-wrap">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isSaving}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowCurrent(v => !v)}>
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label>
            New Password
            <div className="pw-field-wrap">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isSaving}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowNew(v => !v)}>
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label>
            Confirm New Password
            <div className="pw-field-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                disabled={isSaving}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {mismatch && <p className="form-hint pw-mismatch">Passwords do not match</p>}

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              Update Password
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
