// Server `DeviceKind` enum names (case-insensitive on the wire). The phone registers as "Phone".
export type DeviceKind = 'SmartRing' | 'Phone' | 'Watch' | 'Scale' | 'BloodPressureCuff' | 'Other';

export interface HealthRecord {
  id: string;
  slug: string;
  displayName: string | null;
}

// LocationApi DeviceDto — owned directly by the Principal (no health record link).
export interface Device {
  id: string;
  kind: string;
  label: string;
  externalId?: string | null;
  registeredAt: string;
  retiredAt?: string | null;
}

export interface RegisterDeviceRequest {
  kind: DeviceKind;
  label: string;
  externalId?: string;
}

export interface RegisterDeviceResponse {
  device: Device;
  keyId: string;
  apiKey: string; // full `{keyId:N}.{secret}`, shown ONCE — store in keystore, never log
}
