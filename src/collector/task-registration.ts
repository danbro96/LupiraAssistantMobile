import * as Location from 'expo-location';
import { LOCATION_TASK, FGS_NOTIFICATION_BODY, FGS_NOTIFICATION_COLOR, FGS_NOTIFICATION_TITLE } from './constants';
import { paramsFor } from '../domain/sampling';
import { MotionState } from '../domain/motion-state';

// Start/stop/reconfigure the background location-updates task. expo-location has no "update options on
// a running task" API, so adaptive sampling = stop + restart with new options (reconfigure). The task
// body is defined in location-task.ts; this module only references it by name.

export function isCollecting(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
}

export async function startCollecting(state: MotionState = MotionState.Unknown): Promise<void> {
  if (await isCollecting()) return;
  await applyUpdates(state);
}

export async function stopCollecting(): Promise<void> {
  if (await isCollecting()) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

/** Re-apply sampling params for a new motion state (stop + start). Debounced by the caller. */
export async function reconfigure(state: MotionState): Promise<void> {
  if (await isCollecting()) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  await applyUpdates(state);
}

async function applyUpdates(state: MotionState): Promise<void> {
  const p = paramsFor(state);
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: p.accuracy as Location.Accuracy,
    activityType: p.activityType as Location.ActivityType,
    distanceInterval: p.distanceInterval,
    timeInterval: p.timeInterval,
    deferredUpdatesDistance: p.deferredUpdatesDistance,
    deferredUpdatesInterval: p.deferredUpdatesInterval,
    pausesUpdatesAutomatically: false, // we manage pausing via the server kill-switch
    showsBackgroundLocationIndicator: true, // iOS: honest blue status bar
    foregroundService: {
      notificationTitle: FGS_NOTIFICATION_TITLE,
      notificationBody: FGS_NOTIFICATION_BODY,
      notificationColor: FGS_NOTIFICATION_COLOR,
      killServiceOnDestroy: false,
    },
  });
}
