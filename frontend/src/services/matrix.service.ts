import { httpClient } from '../lib/http.client';
import type { AvailabilityStatus, AvailabilityValue, MatrixResponse } from '../lib/api.models';

interface ApiAvailabilityStatus {
  userId: number;
  statusDate?: string;
  date?: string;
  status: AvailabilityValue;
}

interface ApiMatrixResponse {
  employees: MatrixResponse['employees'];
  entries: ApiAvailabilityStatus[];
  publicHolidays: MatrixResponse['publicHolidays'];
  days: string[];
  year: number;
}

function normalizeStatus(entry: ApiAvailabilityStatus): AvailabilityStatus {
  const statusDate = entry.statusDate ?? entry.date;
  if (!statusDate) {
    throw new Error('Matrix API returned an entry without a date.');
  }

  return {
    userId: entry.userId,
    statusDate,
    status: entry.status
  };
}

export async function getMatrix(year: number): Promise<MatrixResponse> {
  const response = await httpClient.get<ApiMatrixResponse>('/matrix', { year });
  return {
    employees: response.employees,
    entries: response.entries.map(normalizeStatus),
    publicHolidays: response.publicHolidays,
    days: response.days,
    year: response.year
  };
}

export async function updateStatus(date: string, status: AvailabilityValue): Promise<AvailabilityStatus> {
  const response = await httpClient.put<ApiAvailabilityStatus, { status: AvailabilityValue }>(`/statuses/${date}`, { status });
  return normalizeStatus(response);
}
