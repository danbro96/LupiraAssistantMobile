import * as Battery from 'expo-battery';

// Read battery level once per delivered batch (not per fix). Returns 0–100 or null if unavailable
// (e.g. simulator). Never throws — battery is a nice-to-have telemetry field.
export async function readBatteryPct(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync(); // 0..1, or -1 when unknown
    if (level < 0) return null;
    return Math.round(level * 100);
  } catch {
    return null;
  }
}
