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

  return (
    <main className="page-shell profile-layout">
      <section className="profile-card">
        <h2>Change Password</h2>

        <div aria-live="polite">
          {success ? <p className="message success">{success}</p> : null}
          {error ? <p className="message error">{error}</p> : null}
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={isSaving}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isSaving}
              required
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              disabled={isSaving}
              required
            />
          </label>

          <div className="profile-actions">
            <button type="submit" className="primary-button" disabled={isSaving}>
              Update Password
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
