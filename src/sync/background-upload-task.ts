import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { kickSync } from './sync-engine';
import { logDebug } from '../debug/log';

// Periodic background flush. The OS wakes this opportunistically (minimum ~15 min; iOS decides actual
// cadence) to resume the cursor, poll the pause state, and drain the buffer — so fixes captured while
// the app is backgrounded/killed still upload without the user opening the app. Defined at module top
// level (imported by index.ts) so it registers during the headless context's cold start. The
// single-flight lock in sync-engine coordinates with the location task and foreground triggers.

export const UPLOAD_TASK = 'lupira.health.upload';

TaskManager.defineTask(UPLOAD_TASK, async () => {
  try {
    await kickSync({ resume: true, poll: true });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    logDebug('bg-upload:error', e instanceof Error ? e.message : String(e));
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Register the periodic upload task (idempotent). Call once from App.tsx. */
export async function registerUploadTask(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      logDebug('bg-upload:restricted');
      return;
    }
    const registered = await TaskManager.isTaskRegisteredAsync(UPLOAD_TASK);
    if (!registered) {
      await BackgroundTask.registerTaskAsync(UPLOAD_TASK, { minimumInterval: 15 }); // minutes
      logDebug('bg-upload:registered');
    }
  } catch (e) {
    logDebug('bg-upload:register-error', e instanceof Error ? e.message : String(e));
  }
}
