import { apiFetch } from './mutator';
import type { HealthRecord, RegisterDeviceRequest, RegisterDeviceResponse } from '../../domain/registration';

/** Create or return the caller's personal health record. Idempotent. */
export function bootstrap(): Promise<HealthRecord> {
  return apiFetch<HealthRecord>('/api/me/bootstrap', { method: 'POST' });
}

export function listRecords(): Promise<HealthRecord[]> {
  return apiFetch<HealthRecord[]>('/api/records', { method: 'GET' });
}

/** Response carries the one-time apiKey — persist it immediately. */
export function registerDevice(req: RegisterDeviceRequest): Promise<RegisterDeviceResponse> {
  return apiFetch<RegisterDeviceResponse>('/api/devices', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
