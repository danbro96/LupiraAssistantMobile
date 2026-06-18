import type { Db } from '../data/db/db';
import * as ingest from '../data/api/ingest';
import * as fixesRepo from '../data/db/pending-fixes-repo';
import * as seqRepo from '../data/db/seq-repo';
import * as syncState from '../data/db/sync-state-repo';
import { logDebug } from '../debug/log';

// On launch / reconnect: fetch the server cursor and drop any buffered fix the server has already
// accepted (seq <= lastSeq) so we don't re-send it, and ensure the local seq counter never sits below
// the server's high-water (matters after a reinstall).

export async function resumeFromCursor(db: Db, deviceId: string): Promise<void> {
  const cursor = await ingest.getCursor(deviceId);
  const lastSeq = cursor.lastSeq ?? 0;
  if (lastSeq > 0) {
    await fixesRepo.deleteUpTo(db, lastSeq);
    await seqRepo.ensureAtLeast(db, 'location', lastSeq);
  }
  await syncState.setCursor(db, deviceId, 'location', cursor.lastSeq);
  logDebug('sync:cursor-resume', `lastSeq=${cursor.lastSeq ?? 'null'}`);
}
