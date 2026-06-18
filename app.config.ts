import type { ExpoConfig } from 'expo/config';

// Expo prebuild/CNG config (native android/ios dirs are generated and git-ignored). The plugin +
// permission blocks below are the load-bearing part for background telemetry: always-on location,
// a foreground service on Android, the iOS background location mode, and motion/activity access.
// Rationale strings are user-facing — keep them honest about what and why.

const LOCATION_ALWAYS_RATIONALE =
  'Lupira Health keeps recording your location in the background — even when the app is closed — '
  + 'so your trips are captured without you having to open it.';
const LOCATION_WHEN_IN_USE_RATIONALE =
  'Lupira Health records your location to track trips and the time you spend at places.';
const MOTION_RATIONALE =
  'Lupira Health uses motion and step data to tell walking, running, cycling and driving apart so '
  + 'it can sample less often when you are still and save battery.';

const config: ExpoConfig = {
  name: 'Lupira Health',
  slug: 'lupirahealth',
  scheme: 'lupirahealth',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.lupira.health',
    infoPlist: {
      // Continue receiving location updates while backgrounded. The expo-background-task plugin
      // appends its own 'processing' mode + BGTaskScheduler identifiers, so we only declare 'location'.
      UIBackgroundModes: ['location'],
      NSLocationWhenInUseUsageDescription: LOCATION_WHEN_IN_USE_RATIONALE,
      NSLocationAlwaysAndWhenInUseUsageDescription: LOCATION_ALWAYS_RATIONALE,
      NSMotionUsageDescription: MOTION_RATIONALE,
    },
  },
  android: {
    package: 'com.lupira.health',
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'ACTIVITY_RECOGNITION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },
  plugins: [
    'expo-secure-store',
    'expo-sqlite',
    'expo-web-browser',
    [
      'expo-location',
      {
        // Wires ACCESS_BACKGROUND_LOCATION + the Android foreground-service plumbing so
        // startLocationUpdatesAsync can run with the app backgrounded/killed.
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        locationAlwaysAndWhenInUsePermission: LOCATION_ALWAYS_RATIONALE,
        locationWhenInUsePermission: LOCATION_WHEN_IN_USE_RATIONALE,
      },
    ],
    'expo-task-manager',
    [
      'expo-sensors',
      { motionPermission: MOTION_RATIONALE },
    ],
    'expo-background-task',
    'expo-status-bar',
    'expo-font',
  ],
};

export default config;
