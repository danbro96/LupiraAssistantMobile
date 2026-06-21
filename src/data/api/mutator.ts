import { oidcAuthPort } from './auth-ports';
import { coreFetch, joinUrl } from './http';
import { ApiError } from '../../domain/api-error';
import { isRetriableRequest } from '../../domain/retry-policy';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = oidcAuthPort();
  const apiUrl = auth.getApiUrl();
  if (!apiUrl) throw new ApiError(0, 'API base URL is not configured.');

  const method = init.method ?? 'GET';
  const retriable = isRetriableRequest(method, false);
  const fullUrl = joinUrl(apiUrl, path);

  const entryToken = auth.getToken();
  let triedReauth = false;
  let token = entryToken;

  for (;;) {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    try {
      const res = await coreFetch(fullUrl, { ...init, headers }, { retriable });
      return await parseBody<T>(res);
    } catch (e) {
      // 401 → force a token refresh and retry once.
      if (e instanceof ApiError && e.status === 401 && !triedReauth) {
        triedReauth = true;
        const fresh = await auth.refresh(true, token ?? undefined);
        if (fresh && fresh !== token) {
          token = fresh;
          continue;
        }
      }
      throw e;
    }
  }
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}
