import { create } from 'zustand';
import * as Sentry from '@sentry/react-native';

// Shared in-memory debug trace, rendered on-device by a debug panel (in __DEV__), echoed to the
// console (Metro / `react-native log-android`), and recorded as Sentry breadcrumbs. Used by the
// registration, collector, and sync paths to diagnose issues without a terminal attached.
//
// SECURITY: every message is run through `redact()` before it leaves this module, so a device API
// key/secret can never end up in the buffer, the console, or a Sentry breadcrumb even if a caller
// accidentally passes one.

export interface DebugLogEntry {
  t: string; // ISO timestamp
  stage: string;
  detail?: string;
}

interface DebugLogState {
  entries: DebugLogEntry[];
  push: (e: DebugLogEntry) => void;
  clear: () => void;
}

const MAX_ENTRIES = 200;

export const useDebugLog = create<DebugLogState>(set => ({
  entries: [],
  push: e => set(s => ({ entries: [...s.entries, e].slice(-MAX_ENTRIES) })),
  clear: () => set({ entries: [] }),
}));

// Device key wire format is `{32hex}.{64hex}`; a `DeviceKey ` Authorization header carries it too.
const DEVICE_KEY_RE = /\b[0-9a-fA-F]{32}\.[0-9a-fA-F]{16,}\b/g;
const DEVICE_KEY_HEADER_RE = /DeviceKey\s+\S+/g;

/** Strip anything resembling a device key / secret from a string before it is logged. */
export function redact(value: string): string {
  return value.replace(DEVICE_KEY_HEADER_RE, 'DeviceKey [redacted]').replace(DEVICE_KEY_RE, '[redacted-key]');
}

/** Record one stage to the buffer, the console, and a Sentry breadcrumb. No PII / secrets in details. */
export function logDebug(stage: string, detail?: string): void {
  const t = new Date().toISOString();
  const safeStage = redact(stage);
  const safeDetail = detail !== undefined ? redact(detail) : undefined;
  useDebugLog.getState().push({ t, stage: safeStage, detail: safeDetail });
  console.log('[debug]', safeStage, safeDetail ?? '');
  try {
    Sentry.addBreadcrumb({
      category: 'debug',
      level: 'info',
      message: safeStage,
      data: safeDetail ? { detail: safeDetail } : undefined,
    });
  } catch {
    // Sentry not initialised yet — the buffer + console still capture it.
  }
}

export function clearDebugLog(): void {
  useDebugLog.getState().clear();
}
