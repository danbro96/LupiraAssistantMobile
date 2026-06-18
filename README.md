# Lupira Health Mobile

A cross-platform (React Native / Expo) **background telemetry uploader** for a personal/family
health-tracking backend, [LupiraHealthApi](https://github.com/) (a .NET sibling of LupiraTasksApi).

It collects GPS fixes in the background — even when the app is closed — buffers them locally while
offline, and **store-and-forwards** them to the server in idempotent NDJSON batches when connectivity
returns. Smart-ring data (Health Connect / HealthKit) is **phase 2**: the tables, serializers, and
ingest stubs exist now and are wired up later.

Architecture and conventions mirror the sibling app **LupiraTasksMobile** (Expo SDK 56, layered
`domain → data → sync → state → ui` enforced by `eslint-plugin-boundaries`, Zustand, `expo-sqlite`,
`expo-secure-store`, OIDC via `expo-auth-session`).

---

## Prerequisites

- Node 20+ and npm
- A **custom dev client** (Expo Go cannot run background location). You'll build one with EAS or
  locally via `expo run:*`.
- The LupiraHealthApi host reachable, and an Authentik `health` OIDC application/provider.

## Setup

```bash
npm install

# Verify the pure logic (no native runtime needed):
npm run typecheck
npm test            # vitest — domain unit tests

# Generate native projects (CNG) and build/run a dev client on a device:
npx expo prebuild
npx expo run:android      # or: npx expo run:ios   (real device recommended)
```

If any native package version drifts from the SDK, reconcile with:

```bash
npx expo install expo-location expo-task-manager expo-sensors expo-battery expo-device expo-background-task
```

## Configuration

Edit `src/config/env.ts` and `src/data/auth/oidc-config.ts`:

- `DEFAULT_API_URL` — the LupiraHealthApi base URL (also overridable in-app on the settings screen).
- `OIDC_ISSUER` / `OIDC_CLIENT_ID` — must match the Authentik `health` provider. The redirect URI is
  `lupirahealth://oauthredirect` (register it on the provider).
- `SENTRY_DSN` — optional; empty disables crash reporting.

The iOS bundle id / Android package (`com.lupira.health`) and `scheme` (`lupirahealth`) live in
`app.config.ts`.

---

## How it works

### Onboarding (one-time)
1. **Sign in** with Authentik (PKCE public client).
2. `POST /api/me/bootstrap` → personal health record; `POST /api/devices {kind:"Phone"}` → device +
   one-time `apiKey` (`{keyId}.{secret}`).
3. The `apiKey` is stored in the **OS secure keystore** only (never in Zustand/SQLite/logs; the debug
   logger redacts it defensively).

### Collection
- `expo-location` background updates via a `TaskManager` task (Android foreground service; iOS
  background-location mode). **Adaptive sampling** by motion state — dense in vehicle/run, sparse when
  still — derived from speed + displacement, debounced to avoid thrash.
- Each fix is mapped to the server wire shape and written to a SQLite buffer with a **crash-safe,
  per-stream monotonic `seq`** (assigned atomically in the same transaction as the insert).
- Low-accuracy fixes are **flagged, not dropped**. While the server reports `paused`, fixes are
  discarded (matching the server).

### Store-and-forward upload
- Pending fixes are batched (≤ 9,000 lines / < 5 MB) and `POST`ed as NDJSON with
  `Authorization: DeviceKey {apiKey}`.
- The 202 receipt is applied: `inserted + duplicates` → deleted locally; permanent rejects → dropped;
  high-water advanced. Retries are unconditionally safe (server dedupes on `seq`).
- Triggered on connectivity regained, app foreground, and a periodic `expo-background-task`.
- **Cursor-resume** on launch/reconnect: `GET …/cursor` → drop buffered fixes `≤ lastSeq`.
- **Pause**: `GET …/state` is polled; the flag is cached for the collector's cheap cross-context read.

---

## Layout

```
src/
  domain/      pure logic (PURE, vitest-tested): wire mapping, motion/sampling, NDJSON, batching,
               receipt application, cursor-drop, seq, reject classification, DTOs
  data/        expo-sqlite repos (buffer, seq, sync-state, collector-meta), secure-store creds,
               HTTP core, OIDC + DeviceKey auth ports, registration + ingest clients
  collector/   the background location task + start/stop/reconfigure, permissions, battery probe
  sync/        uploader, single-flight sync-engine + triggers, cursor-resume, pause-poll,
               background-upload task, the UI-facing sync-status store
  state/       Zustand: auth (OIDC), device (registration mirror), collector (start/stop/hydrate)
  ui/          register + settings screens, theme, shared components
  config/ debug/ feedback/   cross-cutting leaves (env + secure keys, redacting logger, toast/haptics)
```

The layered import graph is enforced by `eslint.config.mjs`. Notably, the background **collector**
and the **sync** layer never import `state`/`ui`, keeping the headless background JS context's
dependency cone small.

---

## Testing & verification

- **Unit (`npm test`)**: every pure `domain/` module — sampling table, motion classification +
  hysteresis, fix mapping (incl. a contract test asserting no `*_id` field ever leaks), NDJSON byte
  math, batching caps, receipt application, cursor-drop, reject classification, seq, geo.
- **Device (dev client)**: see the end-to-end checklist in the plan — register → walk/drive with the
  app backgrounded then killed → buffer offline → reconnect flush → cursor-resume → pause/resume →
  idempotent re-upload. Background delivery after a kill, foreground-service notification, and
  cross-context SQLite writes can only be verified on real hardware.

## Phase 2 — smart ring

`pending_ring` / `pending_summaries` tables, `pending-ring-repo` / `pending-summaries-repo`, and the
`ingest.postRing` / `ingest.postSummaries` clients exist. To finish: add a Health Connect / HealthKit
provider that reads HR/HRV/SpO2/skin-temp/steps + sleep and enqueues ring samples (string `kind`) and
summaries (integer `kind`, camelCase periods), then extend the sync-engine to drain those streams
(reusing `batcher` + `applyReceipt`, which have no `paused` for ring/summaries).
