// Authentik OIDC client config for Lupira Health (public PKCE client — no secret). The issuer +
// client id must match the Authentik `health` application/provider. Mirrors the LupiraTasksMobile
// `tasks` setup; update these to the real `health` provider values before shipping.

export const OIDC_ISSUER = 'https://auth.lupira.com/application/o/health/';

/** Public client id — also the token `aud` the API validates. */
export const OIDC_CLIENT_ID = 'lupira-health';

/** `offline_access` requests a refresh token so the session survives without re-login. */
export const OIDC_SCOPES = ['openid', 'email', 'profile', 'offline_access'];

/** App scheme (app.config.ts `scheme`) — the redirect URI is `<scheme>://<path>`. */
export const OIDC_SCHEME = 'lupirahealth';

/**
 * Redirect path. A bare `lupirahealth://` normalizes to `lupirahealth:` and can't be matched by
 * expo-auth-session; a non-empty path keeps it stable: `lupirahealth://oauthredirect`. This exact URI
 * must be registered as an allowed redirect URI on the Authentik provider.
 */
export const OIDC_REDIRECT_PATH = 'oauthredirect';
