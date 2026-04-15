import PhotoCropModal from '../components/PhotoCropModal';
import { useProfilePage } from '../hooks/useProfilePage';
import { deriveDisplayName, getInitials } from '../lib/name.utils';

export default function ProfilePage(): JSX.Element {
  const {
    currentUser,
    fileInputRef,
    locations,
    locationsLoading,
    teams,
    teamsLoading,
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
    defaultTeamIdValue,
    setDefaultTeamIdValue,
    isSavingProfile,
    isUploadingPhoto,
    isDeletingPhoto,
    isPhotoBusy,
    profileError,
    profileSuccess,
    photoError,
    photoSuccess,
    photoCropSource,
    avatarSrc,
    closeCropModal,
    handleOpenPhotoPicker,
    handlePhotoFileChange,
    handlePhotoConfirm,
    handlePhotoDelete,
    handleProfileSubmit
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
      <section className="profile-card profile-photo-card card card-padded">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Profile"
            className="avatar-display avatar-clickable avatar-hover-overlay"
            onClick={handleOpenPhotoPicker}
          />
        ) : (
          <button
            type="button"
            className="avatar-placeholder avatar-clickable avatar-hover-overlay"
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
            {photoSuccess ? <p className="alert alert-success">{photoSuccess}</p> : null}
            {photoError ? <p className="alert alert-error">{photoError}</p> : null}
          </div>

          <div className="photo-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenPhotoPicker}
              disabled={isPhotoBusy}
            >
              {isUploadingPhoto ? 'Uploading...' : currentUser.photoUrl ? 'Replace Photo' : 'Upload Photo'}
            </button>

            {currentUser.photoUrl ? (
              <button
                type="button"
                className="btn btn-danger"
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

      <section className="profile-card card card-padded">
        <h2>Profile Information</h2>
        <p>{previewDisplayName}</p>

        <div aria-live="polite">
          {profileSuccess ? <p className="alert alert-success">{profileSuccess}</p> : null}
          {profileError ? <p className="alert alert-error">{profileError}</p> : null}
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

          <label>
            Default Team
            <select
              value={defaultTeamIdValue}
              onChange={(event) => setDefaultTeamIdValue(event.target.value)}
              disabled={isSavingProfile || teamsLoading || teams.length === 0}
            >
              {teams.length === 0 ? (
                <option value="">No teams available</option>
              ) : (
                <>
                  <option value="">None</option>
                  {teams.map((team) => (
                    <option key={team.id} value={String(team.id)}>
                      {team.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {teams.length === 0 && <span className="field-hint">Join a team to set a default.</span>}
          </label>

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
              Save Profile
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