import { httpClient } from '../lib/http.client';
import type { SelfRegistrationSettings } from '../lib/api.models';

export function getSelfRegistration(): Promise<SelfRegistrationSettings> {
  return httpClient.get<SelfRegistrationSettings>('/settings/self-registration');
}

export function updateSelfRegistration(enabled: boolean): Promise<SelfRegistrationSettings> {
  return httpClient.put<SelfRegistrationSettings, SelfRegistrationSettings>('/admin/settings/self-registration', {
    enabled
  });
}
