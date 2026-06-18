// Classify ingest reject reasons as permanent (the row will never succeed → drop it) vs. transient
// (leave it buffered to retry). Pure.

/**
 * Permanent: malformed/invalid rows the server will reject identically forever.
 * - `ts_out_of_range` is permanent: a future-clock fix won't become valid, and a fix that has aged
 *   past the retention floor only gets older.
 * - `batch_too_large` is deliberately NOT here — it's a per-BATCH signal, never a per-row drop.
 */
export const PERMANENT_REJECTS: ReadonlySet<string> = new Set([
  'invalid_json',
  'missing_seq',
  'invalid_ts',
  'ts_out_of_range',
  'missing_latlon',
  'invalid_latlon',
  'body_ids_forbidden',
  'unknown_kind',
  'missing_value',
  'missing_kind',
  'invalid_period_start',
  'invalid_period_end',
  'missing_payload',
]);

export function isPermanentReject(reason: string): boolean {
  return PERMANENT_REJECTS.has(reason);
}
