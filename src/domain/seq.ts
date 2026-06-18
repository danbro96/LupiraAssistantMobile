// Pure helpers for the device-monotonic, per-stream sequence number. The actual atomic counter
// lives in SQLite (data/db/seq-repo) so it's shared across the foreground app and the headless
// background JS context; these functions model the decisions so they can be unit-tested in node.

/** The three independent telemetry streams, each with its own monotonic seq. */
export type Stream = 'location' | 'ring' | 'summaries';

export const STREAMS: readonly Stream[] = ['location', 'ring', 'summaries'];

/** The next seq after `current`. seq is gap-tolerant server-side, so simple increment is enough. */
export function nextSeq(current: number): number {
  return current + 1;
}

/**
 * The value the local counter must be seeded to so the device never reuses a seq the server has
 * already accepted (e.g. after a reinstall): the max of the local counter and the server cursor.
 */
export function seedValue(localCurrent: number, serverLastSeq: number | null): number {
  return Math.max(localCurrent, serverLastSeq ?? 0);
}

// One fix/second would take ~285,000 years to exceed Number.MAX_SAFE_INTEGER, so a JS number
// (stored as a SQLite 64-bit INTEGER) is safe for seq — no bigint needed.
