import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Location, Team, User } from '../lib/api.models';
import { getLocations } from '../services/location.service';
import { deleteProfilePhoto, updateProfile, uploadProfilePhoto } from '../services/profile.service';
import { teamService } from '../services/team.service';
import { deriveDisplayName } from '../lib/name.utils';

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
  teams: Team[];
  teamsLoading: boolean;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  firstName: string;
  setFirstName: Dispatch<SetStateAction<string>>;
  middleName: string;
  setMiddleName: Dispatch<SetStateAction<string>>;
  lastName: string;
  setLastName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  locationIdValue: string;
  setLocationIdValue: Dispatch<SetStateAction<string>>;
  defaultTeamIdValue: string;
  setDefaultTeamIdValue: Dispatch<SetStateAction<string>>;
  isSavingProfile: boolean;
  isUploadingPhoto: boolean;
  isDeletingPhoto: boolean;
  isPhotoBusy: boolean;
  profileError: string;
  profileSuccess: string;
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
}

export function useProfilePage(): UseProfilePageResult {
  const { currentUser, updateSessionUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [locationIdValue, setLocationIdValue] = useState('');
  const [defaultTeamIdValue, setDefaultTeamIdValue] = useState('');


  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  const [photoCropSource, setPhotoCropSource] = useState<string | null>(null);
  const [photoUpdatedAt, setPhotoUpdatedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setTitle(currentUser.title ?? '');
    setFirstName(currentUser.firstName);
    setMiddleName(currentUser.middleName ?? '');
    setLastName(currentUser.lastName);
    setEmail(currentUser.email);
    setLocationIdValue(currentUser.locationId ? String(currentUser.locationId) : '');
    setDefaultTeamIdValue(currentUser.defaultTeamId ? String(currentUser.defaultTeamId) : '');
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

  useEffect(() => {
    const loadTeams = async () => {
      setTeamsLoading(true);

      try {
        const loaded = await teamService.getMyTeams();
        setTeams(loaded);
      } catch (error) {
        setProfileError(getErrorMessage(error));
      } finally {
        setTeamsLoading(false);
      }
    };

    void loadTeams();
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
        title,
        firstName,
        middleName,
        lastName,
        email,
        locationId: selectedLocationId,
        defaultTeamId: defaultTeamIdValue ? Number(defaultTeamIdValue) : null
      });

      updateSessionUser({
        ...updatedUser,
        title,
        firstName,
        middleName,
        lastName,
        displayName: updatedUser.displayName || deriveDisplayName({ title, firstName, middleName, lastName })
      });

      setProfileSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
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
  };
}
