import type { ExpoConfig } from 'expo/config';

// Native android/ios dirs are generated and git-ignored. The plugin + permission blocks below are load-bearing for background telemetry.

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
      // Only 'location'; expo-background-task appends its own 'processing' mode + BGTaskScheduler ids.
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
        // Lets startLocationUpdatesAsync run with the app backgrounded/killed.
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
