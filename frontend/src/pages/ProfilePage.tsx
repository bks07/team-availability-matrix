import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import PhotoCropModal from '../components/PhotoCropModal';
import { useAuth } from '../context/AuthContext';
import type { Location, User } from '../lib/api.models';
import { loadSession } from '../lib/storage';
import { getLocations } from '../services/location.service';
import { changePassword, deleteProfilePhoto, updateProfile, uploadProfilePhoto } from '../services/profile.service';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

function getInitials(displayName: string): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || '?';
}

function withTimestamp(url: string, timestamp: number): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${timestamp}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function ProfilePage(): JSX.Element {
  const { currentUser, onAuthSuccess } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [locationIdValue, setLocationIdValue] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const [photoCropSource, setPhotoCropSource] = useState<string | null>(null);
  const [photoUpdatedAt, setPhotoUpdatedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setDisplayName(currentUser.displayName);
    setEmail(currentUser.email);
    setLocationIdValue(currentUser.locationId ? String(currentUser.locationId) : '');
  }, [currentUser]);

  useEffect(() => {
    const loadLocations = async () => {
      setLocationsLoading(true);

      try {
        const loaded = await getLocations();
        setLocations(loaded);
      } catch (error) {
        setProfileError(getErrorMessage(error));
      } finally {
        setLocationsLoading(false);
      }
    };

    void loadLocations();
  }, []);

  const selectedLocationId = useMemo(() => {
    if (!locationIdValue) {
      return null;
    }

    const parsed = Number(locationIdValue);
    return Number.isFinite(parsed) ? parsed : null;
  }, [locationIdValue]);

  const avatarSrc = useMemo(() => {
    if (!currentUser?.photoUrl) {
      return null;
    }

    return withTimestamp(currentUser.photoUrl, photoUpdatedAt);
  }, [currentUser?.photoUrl, photoUpdatedAt]);

  const isPhotoBusy = isUploadingPhoto || isDeletingPhoto;

  if (!currentUser) {
    return <main className="page-shell" />;
  }

  const closeCropModal = () => {
    if (photoCropSource) {
      URL.revokeObjectURL(photoCropSource);
    }

    setPhotoCropSource(null);
  };

  const updateSessionUser = (updatedUser: User) => {
    const session = loadSession();
    if (session) {
      onAuthSuccess({ token: session.token, user: updatedUser }, 'login');
    }
  };

  const handleOpenPhotoPicker = () => {
    if (isPhotoBusy) {
      return;
    }

    setPhotoError('');
    setPhotoSuccess('');
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    setPhotoError('');
    setPhotoSuccess('');

    if (selectedFile.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError('Photo must be 2MB or smaller.');
      return;
    }

    if (photoCropSource) {
      URL.revokeObjectURL(photoCropSource);
    }

    setPhotoCropSource(URL.createObjectURL(selectedFile));
  };

  const handlePhotoConfirm = async (croppedBlob: Blob) => {
    setPhotoError('');
    setPhotoSuccess('');
    setIsUploadingPhoto(true);

    try {
      const file = new File([croppedBlob], `profile-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const updatedUser = await uploadProfilePhoto(file);

      updateSessionUser(updatedUser);
      setPhotoUpdatedAt(Date.now());
      setPhotoSuccess('Profile photo updated successfully.');
      closeCropModal();
    } catch (error) {
      setPhotoError(getErrorMessage(error));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (isPhotoBusy || !currentUser.photoUrl) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to remove your profile photo?');
    if (!confirmed) {
      return;
    }

    setPhotoError('');
    setPhotoSuccess('');
    setIsDeletingPhoto(true);

    try {
      await deleteProfilePhoto();
      updateSessionUser({ ...currentUser, photoUrl: null });
      setPhotoUpdatedAt(Date.now());
      setPhotoSuccess('Profile photo removed successfully.');
    } catch (error) {
      setPhotoError(getErrorMessage(error));
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      const updatedUser = await updateProfile({
        email,
        displayName,
        locationId: selectedLocationId
      });

      const session = loadSession();
      if (session) {
        onAuthSuccess({ token: session.token, user: updatedUser as User }, 'login');
      }

      setProfileSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation must match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccess(response.message);
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

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
            {getInitials(currentUser.displayName)}
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

        <div aria-live="polite">
          {profileSuccess ? <p className="message success">{profileSuccess}</p> : null}
          {profileError ? <p className="message error">{profileError}</p> : null}
        </div>

        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <label>
            Display Name
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isSavingProfile}
              required
            />
          </label>

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