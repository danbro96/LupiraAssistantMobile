// Dependency-inversion seams so the data layer can read the live OIDC token / device key / base URL
// without importing the state layer (which would point a dependency upward). The auth store registers
// concrete providers at startup; data-layer clients consume them through the getters.

export interface OidcAuthPort {
  /** API base URL (honours the settings-screen override). */
  getApiUrl: () => string;
  /** Current OIDC access token, or null when signed out. Used only by registration/records calls. */
  getToken: () => string | null;
  /** Ensure a live token: proactive by default, or `force` after a 401. Returns the token or null. */
  refresh: (force?: boolean, sentToken?: string) => Promise<string | null>;
}

export interface DeviceKeyPort {
  /** API base URL (same source as the OIDC port). */
  getApiUrl: () => string;
  /** The live `{keyId:N}.{secret}` ingest key from the secure keystore, or null if unregistered. */
  getApiKey: () => Promise<string | null>;
}

let oidcPort: OidcAuthPort | null = null;
let devicePort: DeviceKeyPort | null = null;

export function setOidcAuthPort(p: OidcAuthPort): void {
  oidcPort = p;
}

export function oidcAuthPort(): OidcAuthPort {
  if (!oidcPort) throw new Error('OidcAuthPort not registered — import the auth store before using it.');
  return oidcPort;
}

export function setDeviceKeyPort(p: DeviceKeyPort): void {
  devicePort = p;
}

export function deviceKeyPort(): DeviceKeyPort {
  if (!devicePort) throw new Error('DeviceKeyPort not registered — import the auth store before using it.');
  return devicePort;
}
