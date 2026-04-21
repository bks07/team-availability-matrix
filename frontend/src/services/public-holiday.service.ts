import { httpClient } from '../lib/http.client';
import type { PublicHoliday } from '../lib/api.models';

export function getPublicHolidays(locationId?: number): Promise<PublicHoliday[]> {
  const params = locationId ? { locationId } : undefined;
  return httpClient.get<PublicHoliday[]>(
    '/admin/public-holidays',
    params as Record<string, string | number | boolean> | undefined
  );
}

export function createPublicHoliday(holidayDate: string, name: string): Promise<PublicHoliday> {
  return httpClient.post<PublicHoliday, { holidayDate: string; name: string }>(
    '/admin/public-holidays',
    { holidayDate, name }
  );
}

export function updatePublicHoliday(id: number, holidayDate: string, name: string): Promise<PublicHoliday> {
  return httpClient.put<PublicHoliday, { holidayDate: string; name: string }>(
    `/admin/public-holidays/${id}`,
    { holidayDate, name }
  );
}

export function addLocationToHoliday(id: number, locationId: number): Promise<PublicHoliday> {
  return httpClient.post<PublicHoliday, { locationId: number }>(
    `/admin/public-holidays/${id}/locations`,
    { locationId }
  );
}

export function removeLocationFromHoliday(id: number, locationId: number): Promise<void> {
  return httpClient.delete<void>(`/admin/public-holidays/${id}/locations/${locationId}`);
}

export function deletePublicHoliday(id: number): Promise<void> {
  return httpClient.delete<void>(`/admin/public-holidays/${id}`);
}
