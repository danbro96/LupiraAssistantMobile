import type { ActivityKind } from './location-fix';

// Motion classification, kept pure + testable. expo-location exposes NO activity classifier, so we
// derive state heuristically from speed (measured `coords.speed`, or displacement/Δt fallback) plus
// optional pedometer cadence to split run/cycle/vehicle where speeds overlap. Hysteresis
// (debounceMotion) prevents a single noisy sample from flapping the sampling profile.

/** Values match the `activity` wire strings so `activityOf` is an identity map. */
export enum MotionState {
  Unknown = 'unknown',
  Still = 'still',
  Walk = 'walk',
  Run = 'run',
  Cycle = 'cycle',
  Vehicle = 'vehicle',
}

// Speed thresholds (m/s). Tunable; the exact boundaries only affect sampling density, not data.
export const STILL_MAX_MPS = 0.3;
export const WALK_MAX_MPS = 2.2;
export const FAST_MAX_MPS = 8.0; // above this → vehicle
/** Steps/min above which an overlapping-speed reading is treated as running rather than cycling. */
export const RUN_CADENCE_SPM = 120;

export interface MotionInput {
  /** Best speed estimate in m/s, or null when neither measured nor derivable. */
  speedMps: number | null;
  /** True if speedMps came from the GPS sample; false if derived from displacement (lower confidence). */
  speedMeasured: boolean;
  /** Pedometer cadence (steps/min) if available, else null. */
  stepsPerMin: number | null;
}

export interface MotionReading {
  state: MotionState;
  /** 0–100 confidence, reflecting signal strength (measured speed > derived > none). */
  conf: number;
}

/** Classify a single reading into a motion state + confidence. Pure. */
export function classifyMotion(i: MotionInput): MotionReading {
  if (i.speedMps === null) return { state: MotionState.Unknown, conf: 20 };
  const s = i.speedMps;
  let state: MotionState;
  if (s < STILL_MAX_MPS) state = MotionState.Still;
  else if (s < WALK_MAX_MPS) state = MotionState.Walk;
  else if (s < FAST_MAX_MPS) state = (i.stepsPerMin ?? 0) >= RUN_CADENCE_SPM ? MotionState.Run : MotionState.Cycle;
  else state = MotionState.Vehicle;
  const conf = i.speedMeasured ? (state === MotionState.Still ? 70 : 85) : 50;
  return { state, conf };
}

/** Whether a state counts as "moving" for the `is_moving` wire flag. Unknown → not moving (safe default). */
export function isMovingForState(state: MotionState): boolean {
  return state !== MotionState.Still && state !== MotionState.Unknown;
}

/** MotionState → wire activity string (identity, since the enum values match). */
export function activityOf(state: MotionState): ActivityKind {
  return state;
}

export const DEFAULT_HYSTERESIS = 2;

export interface MotionDebounce {
  /** The current committed (stable) state driving the sampling profile. */
  state: MotionState;
  /** A candidate state observed but not yet committed. */
  pending: MotionState | null;
  /** Consecutive observations of `pending`. */
  pendingCount: number;
}

export const INITIAL_DEBOUNCE: MotionDebounce = { state: MotionState.Unknown, pending: null, pendingCount: 0 };

/**
 * Debounce motion transitions: only switch the committed state once a new state has been observed
 * `threshold` times in a row. Prevents stop/start churn of the location-updates task on a single
 * bad GPS speed sample. Pure — returns the next debounce state and whether the committed state changed.
 */
export function debounceMotion(
  prev: MotionDebounce,
  observed: MotionState,
  threshold: number = DEFAULT_HYSTERESIS,
): { next: MotionDebounce; changed: boolean } {
  if (observed === prev.state) {
    // Back to the committed state — clear any pending candidate.
    return { next: { state: prev.state, pending: null, pendingCount: 0 }, changed: false };
  }
  if (observed === prev.pending) {
    const pendingCount = prev.pendingCount + 1;
    if (pendingCount >= threshold) {
      return { next: { state: observed, pending: null, pendingCount: 0 }, changed: true };
    }
    return { next: { state: prev.state, pending: observed, pendingCount }, changed: false };
  }
  // A different candidate than last time — start its streak at 1.
  return { next: { state: prev.state, pending: observed, pendingCount: 1 }, changed: false };
}
