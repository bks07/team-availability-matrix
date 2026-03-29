import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, FormEvent, RefObject, SetStateAction } from 'react';
import { useAuth } from '../context/AuthContext';
import type { CreateUserRequest, Location, UpdateUserRequest, User, UserWithPermissions } from '../lib/api.models';
import { getLocations } from '../services/location.service';
import { bulkAssignLocation, createUser, deleteUser, getUsers, updateUser } from '../services/user.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export interface UserFormState {
  email: string;
  displayName: string;
  password: string;
  locationId: number | null;
}

const INITIAL_FORM: UserFormState = {
  email: '',
  displayName: '',
  password: '',
  locationId: null
};

export interface UseUsersPageResult {
  currentUser: User | null;
  users: UserWithPermissions[];
  locations: Location[];
  newUserForm: UserFormState;
  setNewUserForm: Dispatch<SetStateAction<UserFormState>>;
  editingId: number | null;
  editUserForm: UserFormState;
  setEditUserForm: Dispatch<SetStateAction<UserFormState>>;
  loading: boolean;
  isMutating: boolean;
  isBulkAssigning: boolean;
  error: string;
  success: string;
  selectedUserIds: Set<number>;
  bulkLocationValue: string;
  setBulkLocationValue: Dispatch<SetStateAction<string>>;
  selectionAnnouncement: string;
  selectAllCheckboxRef: RefObject<HTMLInputElement>;
  locationNameById: Map<number, string>;
  selectedCount: number;
  allSelected: boolean;
  toggleUserSelection: (userId: number) => void;
  clearSelection: () => void;
  toggleSelectAll: () => void;
  handleBulkAssign: () => Promise<void>;
  handleCreateUser: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startEditing: (user: UserWithPermissions) => void;
  cancelEditing: () => void;
  handleSaveEdit: (id: number) => Promise<void>;
  handleDelete: (user: UserWithPermissions) => Promise<void>;
}

export function useUsersPage(): UseUsersPageResult {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [newUserForm, setNewUserForm] = useState<UserFormState>(INITIAL_FORM);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUserForm, setEditUserForm] = useState<UserFormState>(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [bulkLocationValue, setBulkLocationValue] = useState('');
  const [selectionAnnouncement, setSelectionAnnouncement] = useState('No users selected.');

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const locationNameById = useMemo(() => {
    return new Map(locations.map((location) => [location.id, location.name]));
  }, [locations]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        const [loadedUsers, loadedLocations] = await Promise.all([getUsers(), getLocations()]);
        setUsers(loadedUsers);
        setLocations(loadedLocations);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const selectedCount = selectedUserIds.size;
  const allSelected = users.length > 0 && selectedCount === users.length;
  const partiallySelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  useEffect(() => {
    const availableIds = new Set(users.map((user) => user.id));
    setSelectedUserIds((previous) => {
      const next = new Set<number>();
      previous.forEach((id) => {
        if (availableIds.has(id)) {
          next.add(id);
        }
      });
      return next.size === previous.size ? previous : next;
    });
  }, [users]);

  useEffect(() => {
    if (selectedCount === 0) {
      setSelectionAnnouncement('No users selected.');
      return;
    }

    setSelectionAnnouncement(`${selectedCount} user${selectedCount === 1 ? '' : 's'} selected.`);
  }, [selectedCount]);

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((previous) => {
      const next = new Set(previous);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
    setBulkLocationValue('');
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      clearSelection();
      return;
    }

    setSelectedUserIds(new Set(users.map((user) => user.id)));
  };

  const handleBulkAssign = async () => {
    if (!bulkLocationValue || selectedCount === 0) {
      return;
    }

    setIsBulkAssigning(true);
    setError('');
    setSuccess('');

    try {
      const locationId = bulkLocationValue === 'none' ? null : Number(bulkLocationValue);
      await bulkAssignLocation({
        userIds: Array.from(selectedUserIds),
        locationId
      });

      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers);
      clearSelection();
      setSuccess('Locations updated successfully for selected users.');
    } catch (assignError) {
      setError(getErrorMessage(assignError));
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = newUserForm.email.trim();
    const displayName = newUserForm.displayName.trim();
    const password = newUserForm.password;

    if (!email) {
      setError('Email is required.');
      setSuccess('');
      return;
    }

    if (!displayName) {
      setError('Display name is required.');
      setSuccess('');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    const payload: CreateUserRequest = {
      email,
      displayName,
      password,
      locationId: newUserForm.locationId
    };

    try {
      const created = await createUser(payload);
      setUsers((previous) => [created, ...previous]);
      setNewUserForm(INITIAL_FORM);
      setSuccess('User created successfully.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (user: UserWithPermissions) => {
    setEditingId(user.id);
    setEditUserForm({
      email: user.email,
      displayName: user.displayName,
      password: '',
      locationId: user.locationId ?? null
    });
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditUserForm(INITIAL_FORM);
  };

  const handleSaveEdit = async (id: number) => {
    const email = editUserForm.email.trim();
    const displayName = editUserForm.displayName.trim();

    if (!email) {
      setError('Email is required.');
      setSuccess('');
      return;
    }

    if (!displayName) {
      setError('Display name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    const payload: UpdateUserRequest = {
      email,
      displayName,
      locationId: editUserForm.locationId
    };

    const nextPassword = editUserForm.password.trim();
    if (nextPassword) {
      payload.password = nextPassword;
    }

    try {
      const updated = await updateUser(id, payload);
      setUsers((previous) => previous.map((user) => (user.id === id ? updated : user)));
      setEditingId(null);
      setEditUserForm(INITIAL_FORM);
      setSuccess('User updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (user: UserWithPermissions) => {
    const confirmed = window.confirm(`Delete user \"${user.displayName}\"?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await deleteUser(user.id);
      setUsers((previous) => previous.filter((item) => item.id !== user.id));
      if (editingId === user.id) {
        cancelEditing();
      }
      setSuccess('User deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsMutating(false);
    }
  };

  return {
    currentUser,
    users,
    locations,
    newUserForm,
    setNewUserForm,
    editingId,
    editUserForm,
    setEditUserForm,
    loading,
    isMutating,
    isBulkAssigning,
    error,
    success,
    selectedUserIds,
    bulkLocationValue,
    setBulkLocationValue,
    selectionAnnouncement,
    selectAllCheckboxRef,
    locationNameById,
    selectedCount,
    allSelected,
    toggleUserSelection,
    clearSelection,
    toggleSelectAll,
    handleBulkAssign,
    handleCreateUser,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleDelete
  };
}
