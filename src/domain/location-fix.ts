// The location wire contract — the exact snake_case JSON shape the server's LocationIngestService
// accepts (one per NDJSON line). This module is PURE (no expo-location import) so it's unit-testable
// in node; the collector passes a structural LocationSample (the shape of expo-location's
// LocationObject) and the derived motion/provider context.

export type LocationProvider = 'gps' | 'network' | 'fused' | 'passive';
export type ActivityKind = 'still' | 'walk' | 'run' | 'cycle' | 'vehicle' | 'unknown';

/** A buffered location fix in server wire form, MINUS `seq` (assigned atomically at insert time). */
export interface WireFix {
  ts: string;
  lat: number;
  lon: number;
  accuracy_m: number | null;
  altitude_m: number | null;
  vertical_acc_m: number | null;
  heading_deg: number | null;
  heading_acc_deg: number | null;
  speed_mps: number | null;
  speed_acc_mps: number | null;
  provider: LocationProvider;
  activity: ActivityKind;
  activity_conf: number | null;
  battery_pct: number | null;
  is_moving: boolean;
  is_mock: boolean;
}

/** The exact set of wire keys. Used by the contract test to assert no `*_id` field ever leaks. */
export const WIRE_FIX_KEYS: readonly (keyof WireFix)[] = [
  'ts', 'lat', 'lon', 'accuracy_m', 'altitude_m', 'vertical_acc_m', 'heading_deg', 'heading_acc_deg',
  'speed_mps', 'speed_acc_mps', 'provider', 'activity', 'activity_conf', 'battery_pct',
  'is_moving', 'is_mock',
];

/** Structural shape of an expo-location LocationObject (kept local so domain stays native-free). */
export interface LocationSample {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp: number; // ms epoch (device clock)
  mocked?: boolean; // Android only; undefined elsewhere
}

/** Per-batch context the collector derives once and applies to every fix in the batch. */
export interface MapContext {
  batteryPct: number | null;
  provider: LocationProvider;
  activity: ActivityKind;
  activityConf: number | null;
  isMoving: boolean;
  /** Injected current time (ms) — also used to clamp a future timestamp (server rejects ts>now+5min). */
  nowMs: number;
}

function round1(v: number | null | undefined): number | null {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return Math.round(v * 10) / 10;
}

/** Android reports `-1` for unknown heading/speed; map those (and nullish) to null. */
function posOrNull(v: number | null | undefined): number | null {
  if (v === null || v === undefined || Number.isNaN(v) || v < 0) return null;
  return v;
}

/**
 * Map a raw location sample + context to the wire fix. Keeps low-accuracy fixes (accuracy_m carries
 * the truth — never dropped here). Clamps a future timestamp to `nowMs` so a bad device clock can't
 * produce a `ts_out_of_range` reject. Never emits any principal_id/device_id field.
 */
export function mapToWireFix(loc: LocationSample, ctx: MapContext): WireFix {
  const tsMs = Math.min(loc.timestamp, ctx.nowMs);
  return {
    ts: new Date(tsMs).toISOString(),
    lat: loc.coords.latitude,
    lon: loc.coords.longitude,
    accuracy_m: round1(loc.coords.accuracy),
    altitude_m: round1(loc.coords.altitude),
    vertical_acc_m: round1(loc.coords.altitudeAccuracy),
    heading_deg: round1(posOrNull(loc.coords.heading)),
    heading_acc_deg: null, // expo-location exposes no heading accuracy
    speed_mps: round1(posOrNull(loc.coords.speed)),
    speed_acc_mps: null, // expo-location exposes no speed accuracy
    provider: ctx.provider,
    activity: ctx.activity,
    activity_conf: ctx.activityConf,
    battery_pct: ctx.batteryPct,
    is_moving: ctx.isMoving,
    is_mock: loc.mocked ?? false,
  };
}
