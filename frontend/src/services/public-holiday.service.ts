import { httpClient } from '../lib/http.client';
import type { PublicHoliday } from '../lib/api.models';

export function getPublicHolidays(locationId?: number): Promise<PublicHoliday[]> {
  const params = locationId ? { locationId } : undefined;
  return httpClient.get<PublicHoliday[]>(
    '/admin/public-holidays',
    params as Record<string, string | number | boolean> | undefined
  );
}

export function createPublicHoliday(holidayDate: string, name: string, locationId: number): Promise<PublicHoliday> {
  return httpClient.post<PublicHoliday, { holidayDate: string; name: string; locationId: number }>(
    '/admin/public-holidays',
    { holidayDate, name, locationId }
  );
}

export function updatePublicHoliday(id: number, holidayDate: string, name: string, locationId: number): Promise<PublicHoliday> {
  return httpClient.put<PublicHoliday, { holidayDate: string; name: string; locationId: number }>(
    `/admin/public-holidays/${id}`,
    { holidayDate, name, locationId }
  );
}

export function deletePublicHoliday(id: number): Promise<void> {
  return httpClient.delete<void>(`/admin/public-holidays/${id}`);
}
