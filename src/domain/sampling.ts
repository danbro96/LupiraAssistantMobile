import { MotionState } from './motion-state';

// Adaptive sampling: motion state → expo-location request options. Dense in vehicle/run, sparse when
// still (which leans on iOS significant-location-change via coarse accuracy + large distance). Pure
// + table-driven so every row is unit-tested. The numeric Accuracy/ActivityType values mirror
// expo-location's enums exactly (so we stay dependency-free here yet pass valid values through).

/** Mirrors expo-location's `Accuracy` enum (integer values). */
export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
} as const;
export type AccuracyValue = (typeof Accuracy)[keyof typeof Accuracy];

/** Mirrors expo-location's `ActivityType` enum (integer values). */
export const ActivityType = {
  Other: 1,
  AutomotiveNavigation: 2,
  Fitness: 3,
  OtherNavigation: 4,
  Airborne: 5,
} as const;
export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType];

export interface SamplingParams {
  accuracy: AccuracyValue;
  activityType: ActivityTypeValue;
  /** Minimum movement (m) between delivered fixes. */
  distanceInterval: number;
  /** Minimum time (ms) between delivered fixes (Android). */
  timeInterval: number;
  /** iOS: batch updates until this much distance (m) accrues. */
  deferredUpdatesDistance: number;
  /** iOS: batch updates until this much time (ms) elapses. */
  deferredUpdatesInterval: number;
}

const TABLE: Record<MotionState, SamplingParams> = {
  [MotionState.Still]: {
    accuracy: Accuracy.Balanced,
    activityType: ActivityType.Other,
    distanceInterval: 100,
    timeInterval: 5 * 60_000,
    deferredUpdatesDistance: 200,
    deferredUpdatesInterval: 10 * 60_000,
  },
  [MotionState.Walk]: {
    accuracy: Accuracy.High,
    activityType: ActivityType.Fitness,
    distanceInterval: 25,
    timeInterval: 30_000,
    deferredUpdatesDistance: 50,
    deferredUpdatesInterval: 60_000,
  },
  [MotionState.Run]: {
    accuracy: Accuracy.High,
    activityType: ActivityType.Fitness,
    distanceInterval: 15,
    timeInterval: 10_000,
    deferredUpdatesDistance: 25,
    deferredUpdatesInterval: 30_000,
  },
  [MotionState.Cycle]: {
    accuracy: Accuracy.High,
    activityType: ActivityType.Fitness,
    distanceInterval: 25,
    timeInterval: 10_000,
    deferredUpdatesDistance: 40,
    deferredUpdatesInterval: 30_000,
  },
  [MotionState.Vehicle]: {
    accuracy: Accuracy.BestForNavigation,
    activityType: ActivityType.AutomotiveNavigation,
    distanceInterval: 30,
    timeInterval: 5_000,
    deferredUpdatesDistance: 50,
    deferredUpdatesInterval: 15_000,
  },
  [MotionState.Unknown]: {
    accuracy: Accuracy.Balanced,
    activityType: ActivityType.Other,
    distanceInterval: 50,
    timeInterval: 60_000,
    deferredUpdatesDistance: 100,
    deferredUpdatesInterval: 120_000,
  },
};

/** Sampling parameters for a motion state. */
export function paramsFor(state: MotionState): SamplingParams {
  return TABLE[state];
}
