// DTOs for the OIDC-authenticated registration endpoints (POST /api/me/bootstrap, GET /api/records,
// POST /api/devices). Pure types.

/** Server `DeviceKind` enum names (case-insensitive on the wire). The phone registers as "Phone". */
export type DeviceKind = 'SmartRing' | 'Phone' | 'Watch' | 'Scale' | 'BloodPressureCuff' | 'Other';

export interface HealthRecord {
  id: string;
  slug: string;
  displayName: string | null;
}

export interface Device {
  id: string;
  healthRecordId: string;
  kind: string;
  label: string;
  externalId?: string | null;
  registeredAt: string;
  retiredAt?: string | null;
}

export interface RegisterDeviceRequest {
  healthRecordId: string;
  kind: DeviceKind;
  label: string;
  externalId?: string;
}

export interface RegisterDeviceResponse {
  device: Device;
  /** Public key id (a GUID). Safe to display. */
  keyId: string;
  /** The full `{keyId:N}.{secret}` ingest key — shown ONCE. Store in the secure keystore, never log. */
  apiKey: string;
}
