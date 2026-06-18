// Lupira Health defaults — overrideable from the in-app settings screen so dev builds can point at
// localhost without rebuilding. Mirrors LupiraTasksMobile's src/config.ts.

/** Default API base URL (sibling of LupiraTasksApi). Overridden via the settings screen. */
export const DEFAULT_API_URL = 'https://health-api.lupira.com';

/** Human-readable app version, shown on the settings screen. Keep in sync with app.config.ts. */
export const APP_VERSION = '0.1.0';

/** Sentry DSN — a public client (ingest) key, safe to commit. Empty disables crash reporting.
 *  Set this to the Lupira Health Sentry project's DSN when one exists. */
export const SENTRY_DSN = '';

// ---- Ingest batching limits (server hard cap is 10,000 lines; keep clear of it) ----

/** Max NDJSON lines per ingest request. Below the server's 10k `batch_too_large` cap, with headroom. */
export const MAX_BATCH_LINES = 9_000;

/** Max NDJSON request body size in bytes (server guidance: <5 MB). */
export const MAX_BATCH_BYTES = 5 * 1024 * 1024 - 64 * 1024;

/** How many rows to pull from the buffer per upload cycle (enough to fill a full batch). */
export const UPLOAD_FETCH_LIMIT = 12_000;
