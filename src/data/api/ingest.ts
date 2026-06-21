import { deviceKeyPort } from './auth-ports';
import { coreFetch, joinUrl } from './http';
import { ApiError, DeviceKeyInvalidError } from '../../domain/api-error';
import { buildDeviceKeyHeader } from '../../domain/device-key-auth';
import type {
  LocationCursor,
  LocationIngestReceipt,
  RingIngestReceipt,
  SummariesIngestReceipt,
  TrackingState,
} from '../../domain/receipts';

// Reads the live key each call so rotation/clear takes effect immediately; 401 = revoked key → re-register, not OIDC re-auth.

async function authedFetch(path: string, init: RequestInit): Promise<Response> {
  const port = deviceKeyPort();
  const apiKey = await port.getApiKey();
  if (!apiKey) throw new ApiError(0, 'No device key — register this device first.');
  const url = joinUrl(port.getApiUrl(), path);
  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', buildDeviceKeyHeader(apiKey));
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  try {
    return await coreFetch(url, { ...init, headers }, { retriable: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw new DeviceKeyInvalidError();
    throw e;
  }
}

export async function postLocation(_deviceId: string, ndjsonBody: string): Promise<LocationIngestReceipt> {
  const res = await authedFetch('/api/ingest/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: ndjsonBody,
  });
  return (await res.json()) as LocationIngestReceipt;
}

export async function postRing(_deviceId: string, ndjsonBody: string): Promise<RingIngestReceipt> {
  const res = await authedFetch('/api/ingest/ring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: ndjsonBody,
  });
  return (await res.json()) as RingIngestReceipt;
}

export async function postSummaries(_deviceId: string, ndjsonBody: string): Promise<SummariesIngestReceipt> {
  const res = await authedFetch('/api/ingest/summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: ndjsonBody,
  });
  return (await res.json()) as SummariesIngestReceipt;
}

/** Highest location seq the server has accepted (resume cursor). */
export async function getCursor(deviceId: string): Promise<LocationCursor> {
  const res = await authedFetch(`/api/ingest/location/cursor?deviceId=${encodeURIComponent(deviceId)}`, {
    method: 'GET',
  });
  return (await res.json()) as LocationCursor;
}

/** Server pause/kill-switch state; when paused, stop collecting + uploading. */
export async function getState(deviceId: string): Promise<TrackingState> {
  const res = await authedFetch(`/api/ingest/location/state?deviceId=${encodeURIComponent(deviceId)}`, {
    method: 'GET',
  });
  return (await res.json()) as TrackingState;
}
