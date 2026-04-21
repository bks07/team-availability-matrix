import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormEvent } from 'react';
import type { Location, PublicHoliday } from '../lib/api.models';
import * as locationService from '../services/location.service';
import * as publicHolidayService from '../services/public-holiday.service';
import { formatHolidayDate, useHolidaysPage } from './useHolidaysPage';

vi.mock('../services/location.service', () => ({
  getLocations: vi.fn(),
}));

vi.mock('../services/public-holiday.service', () => ({
  getPublicHolidays: vi.fn(),
  createPublicHoliday: vi.fn(),
  updatePublicHoliday: vi.fn(),
  addLocationToHoliday: vi.fn(),
  removeLocationFromHoliday: vi.fn(),
  deletePublicHoliday: vi.fn(),
}));

const mockLocations: Location[] = [
  { id: 1, name: 'New York', userCount: 4 },
  { id: 2, name: 'Berlin', userCount: 3 },
];

const mockHolidays: PublicHoliday[] = [
  { id: 1, holidayDate: '2026-12-25', name: 'Christmas Day', locationIds: [1] },
];

function buildSubmitEvent(): FormEvent<HTMLFormElement> {
  return {
    preventDefault: vi.fn(),
  } as unknown as FormEvent<HTMLFormElement>;
}

async function renderUseHolidaysPage() {
  const hook = renderHook(() => useHolidaysPage());

  await waitFor(() => {
    expect(locationService.getLocations).toHaveBeenCalled();
    expect(publicHolidayService.getPublicHolidays).toHaveBeenCalled();
  });

  return hook;
}

describe('useHolidaysPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(locationService.getLocations).mockResolvedValue(mockLocations);
    vi.mocked(publicHolidayService.getPublicHolidays).mockResolvedValue(mockHolidays);
    vi.mocked(publicHolidayService.createPublicHoliday).mockResolvedValue(mockHolidays[0]);
    vi.mocked(publicHolidayService.updatePublicHoliday).mockResolvedValue(mockHolidays[0]);
    vi.mocked(publicHolidayService.addLocationToHoliday).mockResolvedValue(mockHolidays[0]);
    vi.mocked(publicHolidayService.removeLocationFromHoliday).mockResolvedValue(undefined);
    vi.mocked(publicHolidayService.deletePublicHoliday).mockResolvedValue(undefined);
  });

  it('handleAddHoliday with valid date and name calls createPublicHoliday with two args and refreshes holidays', async () => {
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.setNewDate('2026-01-01');
      result.current.setNewName('New Year');
    });

    await act(async () => {
      await result.current.handleAddHoliday(buildSubmitEvent());
    });

    expect(publicHolidayService.createPublicHoliday).toHaveBeenCalledWith('2026-01-01', 'New Year');
    expect(publicHolidayService.getPublicHolidays).toHaveBeenCalledTimes(2);
  });

  it('handleAddHoliday with empty name does not call createPublicHoliday and sets error', async () => {
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.setNewDate('2026-01-01');
      result.current.setNewName('   ');
    });

    await act(async () => {
      await result.current.handleAddHoliday(buildSubmitEvent());
    });

    expect(publicHolidayService.createPublicHoliday).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Holiday name is required.');
  });

  it('handleAddHoliday with empty date does not call createPublicHoliday and sets error', async () => {
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.setNewDate('');
      result.current.setNewName('Holiday Name');
    });

    await act(async () => {
      await result.current.handleAddHoliday(buildSubmitEvent());
    });

    expect(publicHolidayService.createPublicHoliday).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Holiday date is required.');
  });

  it('handleSaveEdit with valid date and name calls updatePublicHoliday with three args', async () => {
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.startEditing(mockHolidays[0]);
      result.current.setEditDate('2026-12-26');
      result.current.setEditName('Boxing Day');
    });

    await act(async () => {
      await result.current.handleSaveEdit(1);
    });

    expect(publicHolidayService.updatePublicHoliday).toHaveBeenCalledWith(1, '2026-12-26', 'Boxing Day');
  });

  it('handleAddLocation calls addLocationToHoliday and refreshes holidays', async () => {
    const { result } = await renderUseHolidaysPage();

    await act(async () => {
      await result.current.handleAddLocation(1, 2);
    });

    expect(publicHolidayService.addLocationToHoliday).toHaveBeenCalledWith(1, 2);
    expect(publicHolidayService.getPublicHolidays).toHaveBeenCalledTimes(2);
  });

  it('handleAddLocation with 409 error populates error state with message', async () => {
    vi.mocked(publicHolidayService.addLocationToHoliday).mockRejectedValueOnce(new Error('Location already assigned to holiday.'));
    const { result } = await renderUseHolidaysPage();

    await act(async () => {
      await result.current.handleAddLocation(1, 2);
    });

    expect(result.current.error).toBe('Location already assigned to holiday.');
  });

  it('handleRemoveLocation when confirm is true calls removeLocationFromHoliday', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = await renderUseHolidaysPage();

    await act(async () => {
      await result.current.handleRemoveLocation(1, 1);
    });

    expect(publicHolidayService.removeLocationFromHoliday).toHaveBeenCalledWith(1, 1);
    confirmSpy.mockRestore();
  });

  it('handleRemoveLocation when confirm is false does not call removeLocationFromHoliday', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = await renderUseHolidaysPage();

    await act(async () => {
      await result.current.handleRemoveLocation(1, 1);
    });

    expect(publicHolidayService.removeLocationFromHoliday).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('handleDelete when confirm is true calls deletePublicHoliday and refreshes holidays', async () => {
    vi.mocked(publicHolidayService.deletePublicHoliday).mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = await renderUseHolidaysPage();

    await act(async () => {
      await result.current.handleDelete(mockHolidays[0]);
    });

    expect(publicHolidayService.deletePublicHoliday).toHaveBeenCalledWith(1);
    expect(publicHolidayService.getPublicHolidays).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });

  it('handleDelete when confirm is false does not call deletePublicHoliday', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = await renderUseHolidaysPage();

    await act(async () => {
      await result.current.handleDelete(mockHolidays[0]);
    });

    expect(publicHolidayService.deletePublicHoliday).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('handleSaveEdit with empty date does not call updatePublicHoliday and sets error', async () => {
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.startEditing(mockHolidays[0]);
      result.current.setEditDate('');
    });

    await act(async () => {
      await result.current.handleSaveEdit(1);
    });

    expect(publicHolidayService.updatePublicHoliday).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Holiday date is required.');
  });

  it('handleSaveEdit with empty name does not call updatePublicHoliday and sets error', async () => {
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.startEditing(mockHolidays[0]);
      result.current.setEditName('   ');
    });

    await act(async () => {
      await result.current.handleSaveEdit(1);
    });

    expect(publicHolidayService.updatePublicHoliday).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Holiday name is required.');
  });

  it('handleSaveEdit when service throws sets error from server message', async () => {
    vi.mocked(publicHolidayService.updatePublicHoliday).mockRejectedValueOnce(
      new Error('A public holiday already exists for this date and name')
    );
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.startEditing(mockHolidays[0]);
      result.current.setEditDate('2026-12-25');
      result.current.setEditName('Christmas Day');
    });

    await act(async () => {
      await result.current.handleSaveEdit(1);
    });

    expect(result.current.error).toBe('A public holiday already exists for this date and name');
  });

  it('handleAddHoliday when service throws sets error from server message', async () => {
    vi.mocked(publicHolidayService.createPublicHoliday).mockRejectedValueOnce(
      new Error('A public holiday already exists for this date and name')
    );
    const { result } = await renderUseHolidaysPage();

    act(() => {
      result.current.setNewDate('2026-12-25');
      result.current.setNewName('Christmas Day');
    });

    await act(async () => {
      await result.current.handleAddHoliday(buildSubmitEvent());
    });

    expect(result.current.error).toBe('A public holiday already exists for this date and name');
  });
});

describe('formatHolidayDate', () => {
  it('valid ISO date returns readable formatted string', () => {
    const formatted = formatHolidayDate('2026-12-25');

    expect(formatted).not.toBe('');
    expect(formatted).not.toBe('2026-12-25');
  });

  it('invalid date string returns the original value', () => {
    expect(formatHolidayDate('not-a-date')).toBe('not-a-date');
  });
});
