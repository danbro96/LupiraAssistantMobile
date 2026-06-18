// Pure geo helpers used by the motion classifier when expo-location doesn't report `coords.speed`
// (common on Android network fixes, where speed is -1/unknown).

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lon points, in meters. */
export function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface GeoPoint {
  lat: number;
  lon: number;
  tsMs: number;
}

/**
 * Speed (m/s) inferred from the displacement between two points over elapsed time. Returns null when
 * the time delta is non-positive (clock went backwards / duplicate timestamp) so the caller can fall
 * back to "unknown".
 */
export function speedFromDisplacement(prev: GeoPoint, cur: GeoPoint): number | null {
  const dtSec = (cur.tsMs - prev.tsMs) / 1000;
  if (dtSec <= 0) return null;
  return haversineMeters(prev.lat, prev.lon, cur.lat, cur.lon) / dtSec;
}
