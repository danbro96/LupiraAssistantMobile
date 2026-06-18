import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

// One SQLite database holds the store-and-forward telemetry buffer (pending_fixes/ring/summaries),
// the per-stream seq counters, sync state, and the collector's cross-context key/value meta.
//
// getDb() is a per-JS-context singleton promise. The headless background location task runs in a
// SEPARATE JS context, so it re-imports this module and opens its OWN connection to the SAME file —
// which is exactly what we want: WAL + busy_timeout serialize the two writers safely.

const DB_NAME = 'lupira-health.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export type Db = SQLite.SQLiteDatabase;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(SCHEMA_SQL);
  return db;
}

/** SQLite stores booleans as 0/1. */
export function boolToInt(v: boolean | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return v ? 1 : 0;
}

export function intToBool(v: number | null | undefined): boolean | null {
  if (v === null || v === undefined) return null;
  return v !== 0;
}
