// TaskManager task name for the background location collector. Defined here so both the task
// definition (location-task) and the start/stop wrappers (task-registration) reference one constant.
export const LOCATION_TASK = 'lupira.health.location.collect';

// Notification shown by the Android foreground service while collecting.
export const FGS_NOTIFICATION_TITLE = 'Lupira Health';
export const FGS_NOTIFICATION_BODY = 'Recording your location';
export const FGS_NOTIFICATION_COLOR = '#0b6e4f';
