import { apiFetch } from './mutator';
import type { HealthRecord, RegisterDeviceRequest, RegisterDeviceResponse } from '../../domain/registration';

// OIDC-authenticated registration client. The phone registers itself once; the returned apiKey is
// then used (via the secure keystore) for all DeviceKey-authenticated ingest.

/** Create or return the caller's personal health record. Idempotent. */
export function bootstrap(): Promise<HealthRecord> {
  return apiFetch<HealthRecord>('/api/me/bootstrap', { method: 'POST' });
}

/** List the health records the caller can write to. */
export function listRecords(): Promise<HealthRecord[]> {
  return apiFetch<HealthRecord[]>('/api/records', { method: 'GET' });
}

/** Register this device. The response carries the one-time apiKey — persist it immediately. */
export function registerDevice(req: RegisterDeviceRequest): Promise<RegisterDeviceResponse> {
  return apiFetch<RegisterDeviceResponse>('/api/devices', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
