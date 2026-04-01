import axios from 'axios';
import { API_BASE_URL } from '../lib/api.config';
import { httpClient } from '../lib/http.client';
import { currentToken } from '../lib/storage';
import type {
  AvailabilityStatus,
  AvailabilityValue,
  BulkStatusRequest,
  BulkStatusResponse,
  MatrixResponse
} from '../lib/api.models';

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
  workSchedules: MatrixResponse['workSchedules'];
  days: string[];
  year: number;
}

export interface ImportMatrixResult {
  updatedCount: number;
  skippedCount: number;
  warnings: string[];
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

export async function getMatrix(year: number, teamId?: number): Promise<MatrixResponse> {
  const queryParams: Record<string, string | number | boolean> = { year };
  if (teamId !== undefined) {
    queryParams.team_id = teamId;
  }
  const response = await httpClient.get<ApiMatrixResponse>('/matrix', queryParams);
  return {
    employees: response.employees,
    entries: response.entries.map(normalizeStatus),
    publicHolidays: response.publicHolidays,
    workSchedules: response.workSchedules,
    days: response.days,
    year: response.year
  };
}

export async function updateStatus(date: string, status: AvailabilityValue): Promise<AvailabilityStatus> {
  const response = await httpClient.put<ApiAvailabilityStatus, { status: AvailabilityValue }>(`/statuses/${date}`, { status });
  return normalizeStatus(response);
}

export async function deleteStatus(date: string): Promise<void> {
  await httpClient.delete<void>(`/statuses/${date}`);
}

export async function bulkUpdateStatuses(request: BulkStatusRequest): Promise<BulkStatusResponse> {
  return httpClient.post<BulkStatusResponse, BulkStatusRequest>('/statuses/bulk', request);
}

export async function exportMatrixCsv(year: number, teamId?: number): Promise<void> {
  const params: Record<string, string | number> = { year };
  if (teamId !== undefined) {
    params.team_id = teamId;
  }

  const baseURL = import.meta.env.DEV ? '/api' : API_BASE_URL;
  const token = currentToken();
  const response = await axios.get(`${baseURL}/matrix/export`, {
    params,
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const blob = new Blob([response.data], { type: 'text/csv' });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `availability-matrix-${year}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function importMatrixCsv(file: File): Promise<ImportMatrixResult> {
  const formData = new FormData();
  formData.append('file', file);
  return httpClient.postForm<ImportMatrixResult>('/matrix/import', formData);
}
