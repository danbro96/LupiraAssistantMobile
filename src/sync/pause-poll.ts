import type { Db } from '../data/db/db';
import * as ingest from '../data/api/ingest';
import * as syncState from '../data/db/sync-state-repo';
import * as collectorMeta from '../data/db/collector-meta-repo';
import { logDebug } from '../debug/log';

// Poll the server's tracking state (the kill switch). Writes the paused flag both to sync_state (UI)
// and collector_meta (the collector's cheap cross-context read). Returns the current paused state.

export async function pollTrackingState(db: Db, deviceId: string): Promise<boolean> {
  const state = await ingest.getState(deviceId);
  await syncState.setPaused(db, deviceId, 'location', state.paused, state.reason);
  await collectorMeta.setPausedCached(db, state.paused);
  logDebug('sync:state-poll', `paused=${state.paused}`);
  return state.paused;
}
