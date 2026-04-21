import type { APIRequestContext, APIResponse } from '@playwright/test';
import { adminCredentials } from './auth';

const APP_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';
const API_BASE_URL = `${APP_BASE_URL.replace(/\/$/, '')}/api`;

interface AuthResponse {
  token: string;
}

interface PublicHoliday {
  id: number;
  holidayDate: string;
  name: string;
  locationIds: number[];
}

interface Location {
  id: number;
  name: string;
  userCount: number;
}

let cachedAdminToken: string | null = null;

async function parseError(response: APIResponse): Promise<string> {
  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return `${response.status()} ${response.statusText()}`;
  }

  try {
    const parsed = JSON.parse(bodyText) as { error?: string };
    if (parsed.error) {
      return parsed.error;
    }
  } catch {
    // Fall through to raw response text.
  }

  return bodyText;
}

async function ensureAdminToken(request: APIRequestContext): Promise<string> {
  if (cachedAdminToken) {
    return cachedAdminToken;
  }

  const { email, password } = adminCredentials();
  const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password }
  });

  if (!loginResponse.ok()) {
    throw new Error(`Admin API login failed: ${await parseError(loginResponse)}`);
  }

  const payload = (await loginResponse.json()) as AuthResponse;
  cachedAdminToken = payload.token;
  return cachedAdminToken;
}

async function adminApiRequest(
  request: APIRequestContext,
  method: 'get' | 'post' | 'delete',
  path: string,
  body?: unknown
): Promise<APIResponse> {
  const token = await ensureAdminToken(request);
  const url = `${API_BASE_URL}${path}`;
  const headers = { Authorization: `Bearer ${token}` };

  if (method === 'get') {
    return request.get(url, { headers });
  }

  if (method === 'post') {
    return request.post(url, { headers, data: body });
  }

  return request.delete(url, { headers });
}

export async function createHoliday(
  request: APIRequestContext,
  date: string,
  name: string
): Promise<PublicHoliday> {
  const response = await adminApiRequest(request, 'post', '/admin/public-holidays', {
    holidayDate: date,
    name
  });

  if (!response.ok()) {
    throw new Error(`Failed to create holiday "${name}": ${await parseError(response)}`);
  }

  return (await response.json()) as PublicHoliday;
}

export async function deleteHolidayByName(
  request: APIRequestContext,
  name: string
): Promise<void> {
  const listResponse = await adminApiRequest(request, 'get', '/admin/public-holidays');

  if (!listResponse.ok()) {
    throw new Error(`Failed to list holidays for cleanup: ${await parseError(listResponse)}`);
  }

  const holidays = (await listResponse.json()) as PublicHoliday[];
  const matches = holidays.filter((holiday) => holiday.name === name);

  for (const holiday of matches) {
    const deleteResponse = await adminApiRequest(request, 'delete', `/admin/public-holidays/${holiday.id}`);
    if (!deleteResponse.ok()) {
      throw new Error(`Failed to delete holiday "${name}": ${await parseError(deleteResponse)}`);
    }
  }
}

export async function createLocation(
  request: APIRequestContext,
  name: string
): Promise<Location> {
  const response = await adminApiRequest(request, 'post', '/admin/locations', { name });

  if (!response.ok()) {
    throw new Error(`Failed to create location "${name}": ${await parseError(response)}`);
  }

  return (await response.json()) as Location;
}

export async function deleteLocationByName(
  request: APIRequestContext,
  name: string
): Promise<void> {
  const listResponse = await adminApiRequest(request, 'get', '/admin/locations');

  if (!listResponse.ok()) {
    throw new Error(`Failed to list locations for cleanup: ${await parseError(listResponse)}`);
  }

  const locations = (await listResponse.json()) as Location[];
  const matches = locations.filter((location) => location.name === name);

  for (const location of matches) {
    const deleteResponse = await adminApiRequest(request, 'delete', `/admin/locations/${location.id}`);
    if (!deleteResponse.ok()) {
      throw new Error(`Failed to delete location "${name}": ${await parseError(deleteResponse)}`);
    }
  }
}

export async function addLocationToHoliday(
  request: APIRequestContext,
  holidayId: number,
  locationId: number
): Promise<PublicHoliday> {
  const response = await adminApiRequest(
    request,
    'post',
    `/admin/public-holidays/${holidayId}/locations`,
    { locationId }
  );

  if (!response.ok()) {
    throw new Error(`Failed to assign location to holiday: ${await parseError(response)}`);
  }

  return (await response.json()) as PublicHoliday;
}
