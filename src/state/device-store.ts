import { create } from 'zustand';
import { bootstrap, registerDevice } from '../data/api/registration';
import {
  loadCredentials,
  saveCredentials,
  clearCredentials,
} from '../data/secure/device-credentials';
import { getDb } from '../data/db/db';
import { resetSeq } from '../data/db/seq-repo';
import * as fixesRepo from '../data/db/pending-fixes-repo';
import * as ringRepo from '../data/db/pending-ring-repo';
import * as summariesRepo from '../data/db/pending-summaries-repo';
import * as syncState from '../data/db/sync-state-repo';
import type { DeviceKind } from '../domain/registration';
import { logDebug } from '../debug/log';

// Non-secret mirror of the registered device (the secret apiKey lives ONLY in secure-store). Drives
// the register screen and the settings header. Owns the one-time registration orchestration.

interface DeviceState {
  loaded: boolean;
  registered: boolean;
  deviceId: string | null;
  keyId: string | null;
  healthRecordId: string | null;
  recordSlug: string | null;
  label: string | null;
  kind: DeviceKind | null;
}

interface DeviceActions {
  load: () => Promise<void>;
  /** One-time registration: bootstrap record → register Phone → persist key → reset local buffers. */
  register: (label: string) => Promise<{ ok: boolean; error?: string }>;
  /** Wipe credentials + local buffers so a fresh device can register. */
  clear: () => Promise<void>;
}

export const useDevice = create<DeviceState & DeviceActions>((set) => ({
  loaded: false,
  registered: false,
  deviceId: null,
  keyId: null,
  healthRecordId: null,
  recordSlug: null,
  label: null,
  kind: null,

  load: async () => {
    const creds = await loadCredentials();
    set({
      loaded: true,
      registered: !!creds,
      deviceId: creds?.deviceId ?? null,
      keyId: creds?.keyId ?? null,
      healthRecordId: creds?.healthRecordId ?? null,
      recordSlug: creds?.recordSlug ?? null,
      label: creds?.label ?? null,
      kind: creds ? 'Phone' : null,
    });
  },

  register: async (label) => {
    try {
      // Single-user: the personal record from bootstrap is the default target. (GET /api/records is
      // available for multi-record selection later.)
      const record = await bootstrap();
      const resp = await registerDevice({ healthRecordId: record.id, kind: 'Phone', label });
      await saveCredentials(resp, record);

      // Fresh device → reset the local streams and clear any stale buffer, then seed sync state.
      const db = await getDb();
      await resetSeq(db, 'location');
      await resetSeq(db, 'ring');
      await resetSeq(db, 'summaries');
      await fixesRepo.clearAll(db);
      await ringRepo.clearAll(db);
      await summariesRepo.clearAll(db);
      await syncState.clearForDevice(db, resp.device.id);
      await syncState.setCursor(db, resp.device.id, 'location', null);

      set({
        registered: true,
        deviceId: resp.device.id,
        keyId: resp.keyId,
        healthRecordId: resp.device.healthRecordId,
        recordSlug: record.slug,
        label: resp.device.label,
        kind: 'Phone',
      });
      logDebug('device:registered', `kind=Phone record=${record.slug}`);
      return { ok: true };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      logDebug('device:register-error', error);
      return { ok: false, error };
    }
  },

  clear: async () => {
    const db = await getDb();
    await fixesRepo.clearAll(db);
    await ringRepo.clearAll(db);
    await summariesRepo.clearAll(db);
    await resetSeq(db, 'location');
    await resetSeq(db, 'ring');
    await resetSeq(db, 'summaries');
    await clearCredentials();
    set({
      registered: false,
      deviceId: null,
      keyId: null,
      healthRecordId: null,
      recordSlug: null,
      label: null,
      kind: null,
    });
  },
}));
