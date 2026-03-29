import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { Location, PublicHoliday } from '../lib/api.models';
import { getLocations } from '../services/location.service';
import {
  createPublicHoliday,
  deletePublicHoliday,
  getPublicHolidays,
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
  newLocationId: number | null;
  setNewLocationId: Dispatch<SetStateAction<number | null>>;
  editingId: number | null;
  editDate: string;
  setEditDate: Dispatch<SetStateAction<string>>;
  editName: string;
  setEditName: Dispatch<SetStateAction<string>>;
  editLocationId: number | null;
  setEditLocationId: Dispatch<SetStateAction<number | null>>;
  loading: boolean;
  error: string;
  success: string;
  isMutating: boolean;
  locationNameById: Map<number, string>;
  handleAddHoliday: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startEditing: (holiday: PublicHoliday) => void;
  cancelEditing: () => void;
  handleSaveEdit: (id: number) => Promise<void>;
  handleDelete: (holiday: PublicHoliday) => Promise<void>;
  formatHolidayDate: (value: string) => string;
}

export function useHolidaysPage(): UseHolidaysPageResult {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null);

  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocationId, setNewLocationId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');
  const [editLocationId, setEditLocationId] = useState<number | null>(null);

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

    if (newLocationId === null) {
      setError('Location is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await createPublicHoliday(newDate, name, newLocationId);
      await refreshHolidays();
      setNewDate('');
      setNewName('');
      setNewLocationId(null);
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
    setEditLocationId(holiday.locationId);
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate('');
    setEditName('');
    setEditLocationId(null);
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

    if (editLocationId === null) {
      setError('Location is required.');
      setSuccess('');
      return;
    }

    setIsMutating(true);
    setError('');
    setSuccess('');

    try {
      await updatePublicHoliday(id, editDate, name, editLocationId);
      await refreshHolidays();
      setEditingId(null);
      setEditDate('');
      setEditName('');
      setEditLocationId(null);
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

  return {
    holidays,
    locations,
    filterLocationId,
    setFilterLocationId,
    newDate,
    setNewDate,
    newName,
    setNewName,
    newLocationId,
    setNewLocationId,
    editingId,
    editDate,
    setEditDate,
    editName,
    setEditName,
    editLocationId,
    setEditLocationId,
    loading,
    error,
    success,
    isMutating,
    locationNameById,
    handleAddHoliday,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleDelete,
    formatHolidayDate
  };
}
