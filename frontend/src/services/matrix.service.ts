import { httpClient } from '../lib/http.client';
import type { AvailabilityStatus, AvailabilityValue, MatrixResponse } from '../lib/api.models';

export function getMatrix(year: number): Promise<MatrixResponse> {
  return httpClient.get<MatrixResponse>('/matrix', { year });
}

export function updateStatus(date: string, status: AvailabilityValue): Promise<AvailabilityStatus> {
  return httpClient.put<AvailabilityStatus, { status: AvailabilityValue }>(`/statuses/${date}`, { status });
}
