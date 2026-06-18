// Pure decisions for the transient-failure retry loop, unit-testable without the fetch machinery.
// The loop itself (sleep + fetch) lives in data/api/http.ts.

/** Max automatic retries after the first attempt (so up to MAX_RETRIES + 1 total attempts). */
export const MAX_RETRIES = 2;

const BASE_DELAY_MS = 300;
const MAX_DELAY_MS = 10_000;

/** Transient = worth retrying: transport failure (0), 429 rate-limit, or any 5xx. */
export function isTransientStatus(status: number): boolean {
  return status === 0 || status === 429 || status >= 500;
}

/**
 * Whether a request is safe to auto-retry. Reads (GET/HEAD) always are. Ingest POSTs ARE safe to
 * retry because the server dedupes on seq (idempotent), so we pass `idempotent: true` for them.
 */
export function isRetriableRequest(method: string | undefined, idempotent: boolean): boolean {
  const m = (method ?? 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD') return true;
  return idempotent;
}

/**
 * Delay before the next attempt. Honors a numeric `Retry-After` (seconds) when present; otherwise
 * exponential backoff (300ms, 600ms, …) plus jitter, capped at MAX_DELAY_MS. `attempt` is 0-based.
 * `rand` is injectable for deterministic tests.
 */
export function retryDelayMs(attempt: number, retryAfter: string | null, rand: () => number = Math.random): number {
  const secs = retryAfter !== null ? Number(retryAfter) : NaN;
  if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, MAX_DELAY_MS);
  const base = BASE_DELAY_MS * 2 ** attempt;
  const jitter = Math.floor(rand() * BASE_DELAY_MS);
  return Math.min(base + jitter, MAX_DELAY_MS);
}
