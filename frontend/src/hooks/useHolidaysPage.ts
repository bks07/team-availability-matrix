import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { Location, PublicHoliday } from '../lib/api.models';
import { getLocations } from '../services/location.service';
import {
  addLocationToHoliday,
  createPublicHoliday,
  deletePublicHoliday,
  getPublicHolidays,
  removeLocationFromHoliday,
  updatePublicHoliday
} from '../services/public-holiday.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function formatHolidayDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

export interface UseHolidaysPageResult {
  holidays: PublicHoliday[];
  locations: Location[];
  filterLocationId: number | null;
  setFilterLocationId: Dispatch<SetStateAction<number | null>>;
  newDate: string;
  setNewDate: Dispatch<SetStateAction<string>>;
  newName: string;
  setNewName: Dispatch<SetStateAction<string>>;
  editingId: number | null;
  editDate: string;
  setEditDate: Dispatch<SetStateAction<string>>;
  editName: string;
  setEditName: Dispatch<SetStateAction<string>>;
  addingLocationToId: number | null;
  addLocationId: number | null;
  setAddLocationId: Dispatch<SetStateAction<number | null>>;
  loading: boolean;
  error: string;
  success: string;
  isMutating: boolean;
  locationNameById: Map<number, string>;
  handleAddHoliday: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startEditing: (holiday: PublicHoliday) => void;
  cancelEditing: () => void;
  handleSaveEdit: (id: number) => Promise<void>;
  handleOpenAddLocation: (holidayId: number) => void;
  handleCancelAddLocation: () => void;
  handleAddLocation: (holidayId: number, locationId: number) => Promise<void>;
  handleRemoveLocation: (holidayId: number, locationId: number) => Promise<void>;
  handleDelete: (holiday: PublicHoliday) => Promise<void>;
  formatHolidayDate: (value: string) => string;
}

export function useHolidaysPage(): UseHolidaysPageResult {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null);

  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');
  const [addingLocationToId, setAddingLocationToId] = useState<number | null>(null);
  const [addLocationId, setAddLocationId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  const locationNameById = useMemo(() => {
    return new Map(locations.map((location) => [location.id, location.name]));
  }, [locations]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');

      try {
        const loadedLocations = await getLocations();
        setLocations(loadedLocations);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadHolidaysByFilter = async () => {
      setLoading(true);
      setError('');

      try {
        const loaded = await getPublicHolidays(filterLocationId ?? undefined);
        setHolidays(loaded);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadHolidaysByFilter();
  }, [filterLocationId]);

  const refreshHolidays = async () => {
    const loaded = await getPublicHolidays(filterLocationId ?? undefined);
    setHolidays(loaded);
  };

  const handleAddHoliday = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newName.trim();
    if (!newDate.trim()) {
      setError('Holiday date is required.');
      setSuccess('');
      return;
    }

    if (!name) {
      setError('Holiday name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await createPublicHoliday(newDate, name);
      await refreshHolidays();
      setNewDate('');
      setNewName('');
      setSuccess('Public holiday created successfully.');
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsMutating(false);
    }
  };

  const startEditing = (holiday: PublicHoliday) => {
    setEditingId(holiday.id);
    setEditDate(holiday.holidayDate);
    setEditName(holiday.name);
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate('');
    setEditName('');
  };

  const handleSaveEdit = async (id: number) => {
    const name = editName.trim();

    if (!editDate.trim()) {
      setError('Holiday date is required.');
      setSuccess('');
      return;
    }

    if (!name) {
      setError('Holiday name is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await updatePublicHoliday(id, editDate, name);
      await refreshHolidays();
      setEditingId(null);
      setEditDate('');
      setEditName('');
      setSuccess('Public holiday updated successfully.');
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (holiday: PublicHoliday) => {
    const confirmed = window.confirm(`Delete public holiday "${holiday.name}"?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await deletePublicHoliday(holiday.id);
      await refreshHolidays();

      if (editingId === holiday.id) {
        cancelEditing();
      }

      setSuccess('Public holiday deleted successfully.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleOpenAddLocation = (holidayId: number) => {
    setAddingLocationToId(holidayId);
    setAddLocationId(null);
  };

  const handleCancelAddLocation = () => {
    setAddingLocationToId(null);
    setAddLocationId(null);
  };

  const handleAddLocation = async (holidayId: number, locationId: number) => {
    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await addLocationToHoliday(holidayId, locationId);
      await refreshHolidays();
      handleCancelAddLocation();
    } catch (addError) {
      setError(getErrorMessage(addError));
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveLocation = async (holidayId: number, locationId: number) => {
    const holidayName = holidays.find((holiday) => holiday.id === holidayId)?.name ?? 'this holiday';
    const locationName = locationNameById.get(locationId) ?? `Location #${locationId}`;
    const confirmed = window.confirm(`Remove ${locationName} from ${holidayName}?`);
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await removeLocationFromHoliday(holidayId, locationId);
      await refreshHolidays();
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    } finally {
      setIsMutating(false);
    }
  };

  return {
    holidays,
    locations,
    filterLocationId,
    setFilterLocationId,
    newDate,
    setNewDate,
    newName,
    setNewName,
    editingId,
    editDate,
    setEditDate,
    editName,
    setEditName,
    addingLocationToId,
    addLocationId,
    setAddLocationId,
    loading,
    error,
    success,
    isMutating,
    locationNameById,
    handleAddHoliday,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleOpenAddLocation,
    handleCancelAddLocation,
    handleAddLocation,
    handleRemoveLocation,
    handleDelete,
    formatHolidayDate
  };
}
