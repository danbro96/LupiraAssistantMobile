import { ApiError, REQUEST_TIMEOUT_MS } from '../../domain/api-error';
import { MAX_RETRIES, isTransientStatus, retryDelayMs } from '../../domain/retry-policy';

// Low-level fetch shared by the OIDC mutator and the DeviceKey ingest client. Owns: abort timeout,
// bounded retry of transient failures (timeout/5xx/429), and non-2xx → ApiError. Auth + base URL are
// the callers' job (they pass a fully-formed URL + headers).

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** One fetch attempt with its own abort timeout; transport failures become ApiError(0, …). */
async function fetchWithTimeout(fullUrl: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(fullUrl, { ...init, signal: controller.signal });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      0,
      aborted
        ? `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
        : `Network unreachable: ${e instanceof Error ? e.message : String(e)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export interface CoreFetchOptions {
  /** Whether the request is safe to auto-retry on a transient failure (idempotent reads/ingest). */
  retriable: boolean;
}

/**
 * Perform a request with bounded retry, returning the raw Response on a 2xx and throwing ApiError on
 * a terminal non-2xx (the body text becomes the message; status carried for branching).
 */
export async function coreFetch(fullUrl: string, init: RequestInit, opts: CoreFetchOptions): Promise<Response> {
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetchWithTimeout(fullUrl, init);
    } catch (e) {
      if (opts.retriable && attempt < MAX_RETRIES) {
        await sleep(retryDelayMs(attempt, null));
        continue;
      }
      throw e;
    }

    if (res.ok) return res;

    if (opts.retriable && isTransientStatus(res.status) && attempt < MAX_RETRIES) {
      await sleep(retryDelayMs(attempt, res.headers.get('retry-after')));
      continue;
    }

    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText || `HTTP ${res.status}`);
  }
}

/** Join a base URL and a leading-slash path without doubling slashes. */
export function joinUrl(baseUrl: string, path: string): string {
  return baseUrl.replace(/\/$/, '') + path;
}
