import type { Db } from './db';
import type { Stream } from '../../domain/seq';

// Atomic per-stream monotonic seq. SQLite is the single source of truth (a JS counter would collide
// across the foreground + background JS contexts). `UPDATE ... RETURNING` does the read-modify-write
// in one statement; callers run it inside the same transaction as the row insert (see
// pending-fixes-repo) so a seq is never burned without a durable row, and never the reverse.

/** Increment and return the next seq for a stream. Run inside the insert transaction. */
export async function nextSeq(db: Db, stream: Stream): Promise<number> {
  const row = await db.getFirstAsync<{ last_seq: number }>(
    `UPDATE seq_counter SET last_seq = last_seq + 1 WHERE stream = ? RETURNING last_seq`,
    [stream],
  );
  if (!row) throw new Error(`seq_counter row missing for stream '${stream}'`);
  return row.last_seq;
}

/** Current counter value without incrementing. */
export async function peekSeq(db: Db, stream: Stream): Promise<number> {
  const row = await db.getFirstAsync<{ last_seq: number }>(
    `SELECT last_seq FROM seq_counter WHERE stream = ?`,
    [stream],
  );
  return row?.last_seq ?? 0;
}

/** Raise the counter to at least `value` (used to seed from the server cursor after reinstall). Never lowers. */
export async function ensureAtLeast(db: Db, stream: Stream, value: number): Promise<void> {
  await db.runAsync(
    `UPDATE seq_counter SET last_seq = ? WHERE stream = ? AND last_seq < ?`,
    [value, stream, value],
  );
}

/** Reset a stream's counter (used on re-registration — a fresh device starts at 0). */
export async function resetSeq(db: Db, stream: Stream, value = 0): Promise<void> {
  await db.runAsync(`UPDATE seq_counter SET last_seq = ? WHERE stream = ?`, [value, stream]);
}
