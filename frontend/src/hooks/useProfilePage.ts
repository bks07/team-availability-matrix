import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Location, User } from '../lib/api.models';
import { getLocations } from '../services/location.service';
import { changePassword, deleteProfilePhoto, updateProfile, uploadProfilePhoto } from '../services/profile.service';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

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

export interface UseProfilePageResult {
  currentUser: User | null;
  fileInputRef: RefObject<HTMLInputElement>;
  locations: Location[];
  locationsLoading: boolean;
  displayName: string;
  setDisplayName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  locationIdValue: string;
  setLocationIdValue: Dispatch<SetStateAction<string>>;
  currentPassword: string;
  setCurrentPassword: Dispatch<SetStateAction<string>>;
  newPassword: string;
  setNewPassword: Dispatch<SetStateAction<string>>;
  confirmNewPassword: string;
  setConfirmNewPassword: Dispatch<SetStateAction<string>>;
  isSavingProfile: boolean;
  isSavingPassword: boolean;
  isUploadingPhoto: boolean;
  isDeletingPhoto: boolean;
  isPhotoBusy: boolean;
  profileError: string;
  profileSuccess: string;
  passwordError: string;
  passwordSuccess: string;
  photoError: string;
  photoSuccess: string;
  photoCropSource: string | null;
  avatarSrc: string | null;
  closeCropModal: () => void;
  handleOpenPhotoPicker: () => void;
  handlePhotoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePhotoConfirm: (croppedBlob: Blob) => Promise<void>;
  handlePhotoDelete: () => Promise<void>;
  handleProfileSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePasswordSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useProfilePage(): UseProfilePageResult {
  const { currentUser, updateSessionUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const closeCropModal = () => {
    if (photoCropSource) {
      URL.revokeObjectURL(photoCropSource);
    }

    setPhotoCropSource(null);
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
    if (isPhotoBusy || !currentUser?.photoUrl) {
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

      updateSessionUser(updatedUser);

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

  return {
    currentUser,
    fileInputRef,
    locations,
    locationsLoading,
    displayName,
    setDisplayName,
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
  };
}
