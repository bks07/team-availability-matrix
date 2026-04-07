import { httpClient } from '../lib/http.client';
import type { Location } from '../lib/api.models';

export function getLocations(): Promise<Location[]> {
  return httpClient.get<Location[]>('/admin/locations');
}

export function createLocation(name: string): Promise<Location> {
  return httpClient.post<Location, { name: string }>('/admin/locations', { name });
}

export function updateLocation(id: number, name: string): Promise<Location> {
  return httpClient.put<Location, { name: string }>(`/admin/locations/${id}`, { name });
}

export function deleteLocation(id: number, force?: boolean): Promise<void> {
  const query = force ? '?force=true' : '';
  return httpClient.delete<void>(`/admin/locations/${id}${query}`);
}
