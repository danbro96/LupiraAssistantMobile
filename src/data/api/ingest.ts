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

// DeviceKey-authenticated ingest client (NDJSON upload + cursor/state reads). Reads the live key from
// the secure keystore each call (so rotation/clear takes effect immediately). Ingest is idempotent
// server-side (dedupe on seq) so all calls are safe to auto-retry. A 401 means the key was revoked →
// DeviceKeyInvalidError (the caller re-registers; it must NOT try OIDC re-auth here).

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

/** POST a batch of location fixes as NDJSON. Returns the 202 receipt. */
export async function postLocation(_deviceId: string, ndjsonBody: string): Promise<LocationIngestReceipt> {
  const res = await authedFetch('/api/ingest/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: ndjsonBody,
  });
  return (await res.json()) as LocationIngestReceipt;
}

/** POST a batch of ring samples as NDJSON (phase 2). */
export async function postRing(_deviceId: string, ndjsonBody: string): Promise<RingIngestReceipt> {
  const res = await authedFetch('/api/ingest/ring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: ndjsonBody,
  });
  return (await res.json()) as RingIngestReceipt;
}

/** POST a batch of device summaries as NDJSON (phase 2). */
export async function postSummaries(_deviceId: string, ndjsonBody: string): Promise<SummariesIngestReceipt> {
  const res = await authedFetch('/api/ingest/summaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: ndjsonBody,
  });
  return (await res.json()) as SummariesIngestReceipt;
}

/** Resume cursor: the highest location seq the server has accepted for this device. */
export async function getCursor(deviceId: string): Promise<LocationCursor> {
  const res = await authedFetch(`/api/ingest/location/cursor?deviceId=${encodeURIComponent(deviceId)}`, {
    method: 'GET',
  });
  return (await res.json()) as LocationCursor;
}

/** Tracking pause state (the kill switch). When paused, stop collecting + uploading. */
export async function getState(deviceId: string): Promise<TrackingState> {
  const res = await authedFetch(`/api/ingest/location/state?deviceId=${encodeURIComponent(deviceId)}`, {
    method: 'GET',
  });
  return (await res.json()) as TrackingState;
}
