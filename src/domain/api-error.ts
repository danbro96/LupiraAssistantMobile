// Transport/error primitives shared by the API mutator and the ingest client. Dependency-free so
// pure consumers can import them under the node unit-test harness.

/**
 * Single-axis error for every non-2xx response. Consumers branch on `err.status`. Status 0 = no HTTP
 * response (timeout / unreachable host).
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Thrown when an ingest call gets a 401 — the device key was revoked (device retired elsewhere). The
 * caller must stop uploading and prompt re-registration; it must NOT attempt OIDC re-auth (the ingest
 * path has no user token).
 */
export class DeviceKeyInvalidError extends ApiError {
  constructor(message = 'Device key rejected (401) — re-register this device.') {
    super(401, message);
    this.name = 'DeviceKeyInvalidError';
  }
}

/** True for transport-level failures (timeout / unreachable host) — status 0, no HTTP response. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0;
}

/** Requests abort after this long so a dead/slow server fails fast instead of hanging forever. */
export const REQUEST_TIMEOUT_MS = 15_000;
