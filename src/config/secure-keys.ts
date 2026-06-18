// Centralized expo-secure-store key names. The device API key + secret are the ONLY truly secret
// values and live exclusively under `apiKey` here — never in Zustand, SQLite, AsyncStorage, or logs.

export const SECURE_KEYS = {
  /** API base URL override (non-secret; SecureStore is just the available k/v store). */
  apiUrl: 'lupira.health.apiUrl',

  // --- OIDC session (user login, used only for registration/records calls) ---
  oidcToken: 'lupira.health.oidc.token',
  oidcRefresh: 'lupira.health.oidc.refreshToken',
  oidcExpires: 'lupira.health.oidc.expiresAt',
  userSub: 'lupira.health.oidc.userSub',
  userName: 'lupira.health.oidc.userName',

  // --- Device ingest credential ---
  /** The full `{keyId:N}.{secret}` ingest key. SECRET — never log it. */
  apiKey: 'lupira.health.apiKey',
  /** Public key id (safe to display). */
  keyId: 'lupira.health.keyId',
  /** Registered device id (used in cursor/state query params). */
  deviceId: 'lupira.health.deviceId',
  /** The health record this device writes to. */
  healthRecordId: 'lupira.health.healthRecordId',
  /** Human label chosen at registration (for the settings screen). */
  deviceLabel: 'lupira.health.deviceLabel',
  /** Slug of the chosen health record (for the settings screen). */
  recordSlug: 'lupira.health.recordSlug',
} as const;
