// The device API key + secret are the ONLY truly secret values — keep them under `apiKey` only, never in Zustand/SQLite/AsyncStorage/logs.

export const SECURE_KEYS = {
  apiUrl: 'lupira.health.apiUrl',

  oidcToken: 'lupira.health.oidc.token',
  oidcRefresh: 'lupira.health.oidc.refreshToken',
  oidcExpires: 'lupira.health.oidc.expiresAt',
  userSub: 'lupira.health.oidc.userSub',
  userName: 'lupira.health.oidc.userName',

  /** The full `{keyId:N}.{secret}` ingest key. SECRET — never log it. */
  apiKey: 'lupira.health.apiKey',
  /** Public key id (safe to display). */
  keyId: 'lupira.health.keyId',
  deviceId: 'lupira.health.deviceId',
  healthRecordId: 'lupira.health.healthRecordId',
  deviceLabel: 'lupira.health.deviceLabel',
  recordSlug: 'lupira.health.recordSlug',
} as const;
