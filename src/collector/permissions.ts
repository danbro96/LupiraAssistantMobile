import * as Location from 'expo-location';

// Location permission handling. iOS requires When-In-Use first, then escalation to Always; Android 10+
// requires foreground granted before background. Each request must be user-initiated so the OS shows
// the dialogs at a sensible moment (and iOS doesn't waste its one-shot "Always" prompt).

export type PermissionStage = 'denied' | 'foreground' | 'background';

/** Current stage WITHOUT prompting (for the settings screen + launch reconciliation). */
export async function getStage(): Promise<PermissionStage> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.getBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'background' : 'foreground';
}

/**
 * Request the full background ("Always") permission, escalating foreground → background. Returns the
 * highest stage reached so the UI can deep-link to Settings if the user got stuck at foreground.
 */
export async function ensureBackgroundPermissions(): Promise<PermissionStage> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted' ? 'background' : 'foreground';
}
