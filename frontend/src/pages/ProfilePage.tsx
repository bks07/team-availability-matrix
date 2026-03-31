import PhotoCropModal from '../components/PhotoCropModal';
import { useProfilePage } from '../hooks/useProfilePage';
import { deriveDisplayName, getInitials } from '../lib/name.utils';

export default function ProfilePage(): JSX.Element {
  const {
    currentUser,
    fileInputRef,
    locations,
    locationsLoading,
    title,
    setTitle,
    firstName,
    setFirstName,
    middleName,
    setMiddleName,
    lastName,
    setLastName,
    email,
    setEmail,
    locationIdValue,
    setLocationIdValue,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isSavingProfile,
    isSavingPassword,
    isUploadingPhoto,
    isDeletingPhoto,
    isPhotoBusy,
    profileError,
    profileSuccess,
    passwordError,
    passwordSuccess,
    photoError,
    photoSuccess,
    photoCropSource,
    avatarSrc,
    closeCropModal,
    handleOpenPhotoPicker,
    handlePhotoFileChange,
    handlePhotoConfirm,
    handlePhotoDelete,
    handleProfileSubmit,
    handlePasswordSubmit
  } = useProfilePage();

  if (!currentUser) {
    return <main className="page-shell" />;
  }

  const previewDisplayName = deriveDisplayName({
    title,
    firstName,
    middleName,
    lastName
  });

  return (
    <main className="page-shell profile-layout">
      <section className="profile-card profile-photo-card">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Profile"
            className="avatar-display avatar-clickable"
            onClick={handleOpenPhotoPicker}
          />
        ) : (
          <button
            type="button"
            className="avatar-placeholder avatar-clickable"
            onClick={handleOpenPhotoPicker}
            disabled={isPhotoBusy}
            aria-label="Upload profile photo"
          >
            {getInitials(currentUser) || '?'}
          </button>
        )}

        <div className="photo-details">
          <h3>Profile Photo</h3>
          <p className="photo-hint">Upload a clear headshot. JPEG, PNG, WEBP, or GIF up to 2MB.</p>

          <div aria-live="polite">
            {photoSuccess ? <p className="message success">{photoSuccess}</p> : null}
            {photoError ? <p className="message error">{photoError}</p> : null}
          </div>

          <div className="photo-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleOpenPhotoPicker}
              disabled={isPhotoBusy}
            >
              {isUploadingPhoto ? 'Uploading...' : currentUser.photoUrl ? 'Replace Photo' : 'Upload Photo'}
            </button>

            {currentUser.photoUrl ? (
              <button
                type="button"
                className="danger-button"
                onClick={handlePhotoDelete}
                disabled={isPhotoBusy}
              >
                {isDeletingPhoto ? 'Removing...' : 'Remove'}
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handlePhotoFileChange}
          disabled={isPhotoBusy}
        />
      </section>

      <section className="profile-card">
        <h2>Profile Information</h2>
        <p>{previewDisplayName}</p>

        <div aria-live="polite">
          {profileSuccess ? <p className="message success">{profileSuccess}</p> : null}
          {profileError ? <p className="message error">{profileError}</p> : null}
        </div>

        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <fieldset>
            <legend>Name</legend>
            <div className="name-fields">
              <label>
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={isSavingProfile}
                  size={8}
                  placeholder="Dr"
                  maxLength={30}
                />
              </label>

              <label>
                First Name
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  disabled={isSavingProfile}
                  required
                />
              </label>

              <label>
                Middle Name
                <input
                  type="text"
                  value={middleName}
                  onChange={(event) => setMiddleName(event.target.value)}
                  disabled={isSavingProfile}
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  disabled={isSavingProfile}
                  required
                />
              </label>
            </div>
          </fieldset>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSavingProfile}
              required
            />
          </label>

          <label>
            Location
            <select
              value={locationIdValue}
              onChange={(event) => setLocationIdValue(event.target.value)}
              disabled={isSavingProfile || locationsLoading}
            >
              <option value="">No location</option>
              {locations.map((location) => (
                <option key={location.id} value={String(location.id)}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <div className="profile-actions">
            <button type="submit" className="primary-button" disabled={isSavingProfile}>
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <section className="profile-card">
        <h2>Change Password</h2>

        <div aria-live="polite">
          {passwordSuccess ? <p className="message success">{passwordSuccess}</p> : null}
          {passwordError ? <p className="message error">{passwordError}</p> : null}
        </div>

        <form className="profile-form" onSubmit={handlePasswordSubmit}>
          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={isSavingPassword}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isSavingPassword}
              required
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              disabled={isSavingPassword}
              required
            />
          </label>

          <div className="profile-actions">
            <button type="submit" className="primary-button" disabled={isSavingPassword}>
              Update Password
            </button>
          </div>
        </form>
      </section>

      {photoCropSource ? (
        <PhotoCropModal imageSrc={photoCropSource} onConfirm={handlePhotoConfirm} onCancel={closeCropModal} />
      ) : null}
    </main>
  );
}