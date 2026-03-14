import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AvailabilityEntry, AvailabilityStatus, MatrixResponse } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MatrixService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  getMatrix(year: number): Promise<MatrixResponse> {
    return firstValueFrom(
      this.http.get<MatrixResponse>(`${API_BASE_URL}/matrix`, {
        headers: this.authService.authHeaders(),
        params: { year }
      })
    );
  }

  setOwnStatus(date: string, status: AvailabilityStatus): Promise<AvailabilityEntry> {
    return firstValueFrom(
      this.http.put<AvailabilityEntry>(
        `${API_BASE_URL}/statuses/${date}`,
        { status },
        { headers: this.authService.authHeaders() }
      )
    );
  }
}
