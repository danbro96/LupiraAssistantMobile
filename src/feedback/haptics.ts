import * as Haptics from 'expo-haptics';

// Fire-and-forget haptics, reserved for meaningful moments (registration success, errors). Each
// safely no-ops where the platform can't vibrate. A leaf module (expo-haptics only), so any layer
// may call it.

/** Positive outcome (e.g. device registered, upload flushed). */
export function hapticSuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Action failed or was blocked. */
export function hapticError(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Light tick for crossing a threshold / changing a selection. */
export function hapticSelection(): void {
  void Haptics.selectionAsync().catch(() => {});
}
