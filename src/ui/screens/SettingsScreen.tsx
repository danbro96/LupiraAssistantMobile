import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useDevice } from '../../state/device-store';
import { useCollector } from '../../state/collector-store';
import { useSyncStatus, refreshSyncStatus } from '../../sync/sync-status';
import { kickSync } from '../../sync/sync-engine';
import { useAuth } from '../../state/auth-store';
import { getDb } from '../../data/db/db';
import { Button } from '../components/Button';
import { makeType, radii, spacing, useColors, type Palette } from '../theme';
import { toast } from '../../feedback/toast';

// Minimal settings: device identity, collection toggle, server pause banner, last-upload status, and
// an API-URL override for dev. Reads live status from the sync-status store (refreshed on mount and
// after each upload kick).

export function SettingsScreen() {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const device = useDevice();
  const collector = useCollector();
  const status = useSyncStatus();
  const apiUrl = useAuth((s) => s.apiUrl);
  const mirror = useSyncStatus((s) => s.mirror);

  const [apiUrlDraft, setApiUrlDraft] = useState(apiUrl);

  const refresh = useCallback(async () => {
    if (!device.deviceId) return;
    const db = await getDb();
    await refreshSyncStatus(db, device.deviceId);
  }, [device.deviceId]);

  useEffect(() => {
    void collector.hydrate();
    void collector.refreshPermissions();
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refresh();
  }, [mirror, refresh]);

  async function onToggleCollecting(next: boolean) {
    if (next) {
      const res = await useCollector.getState().start();
      if (!res.ok) {
        toast(
          res.stage === 'foreground'
            ? 'Enable "Always" location in Settings to record in the background.'
            : 'Location permission is required to collect.',
        );
      }
    } else {
      await useCollector.getState().stop();
    }
    await refresh();
  }

  function onUploadNow() {
    void (async () => {
      await kickSync({ resume: true, poll: true });
      await refresh();
      toast('Upload triggered.');
    })();
  }

  async function onSaveApiUrl() {
    await useAuth.getState().setApiUrl(apiUrlDraft.trim());
    toast('API URL saved.');
  }

  function onReRegister() {
    Alert.alert('Re-register device?', 'This clears the local key and buffered fixes. You will register again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Re-register',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await useCollector.getState().stop();
            await useDevice.getState().clear();
            await useAuth.getState().clearSession();
          })();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Device */}
      <Text style={styles.section}>DEVICE</Text>
      <View style={styles.card}>
        <Row label="Label" value={device.label ?? '—'} c={c} />
        <Row label="Kind" value={device.kind ?? '—'} c={c} />
        <Row label="Record" value={device.recordSlug ?? '—'} c={c} />
        <Row label="Key id" value={device.keyId ?? '—'} c={c} mono />
      </View>

      {/* Collection */}
      <Text style={styles.section}>COLLECTION</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.rowLabel}>Record location</Text>
          <Switch value={collector.collecting} onValueChange={(v) => void onToggleCollecting(v)} disabled={collector.starting} />
        </View>
        <Row label="Permission" value={collector.permissionStage} c={c} />
        {collector.permissionStage !== 'background' ? (
          <Text style={styles.warn}>Background ("Always") location is required to record while the app is closed.</Text>
        ) : null}
        {status.paused ? (
          <Text style={styles.warn}>Tracking is paused on the server{status.pausedReason ? ` (${status.pausedReason})` : ''}. Fixes are discarded until it resumes.</Text>
        ) : null}
      </View>

      {/* Upload status */}
      <Text style={styles.section}>UPLOAD STATUS</Text>
      <View style={styles.card}>
        <Row label="Connectivity" value={status.online ? 'online' : 'offline'} c={c} />
        <Row label="Uploading" value={status.uploading ? 'yes' : 'no'} c={c} />
        <Row label="Buffered fixes" value={String(status.pendingCount)} c={c} mono />
        <Row label="Last uploaded seq" value={String(status.lastUploadedSeq)} c={c} mono />
        <Row label="Server high-water" value={status.highWaterSeq === null ? '—' : String(status.highWaterSeq)} c={c} mono />
        <Row label="Last upload" value={status.lastUploadAt ? new Date(status.lastUploadAt).toLocaleString() : 'never'} c={c} />
        {status.lastError ? <Text style={styles.error}>Last error: {status.lastError}</Text> : null}
        <Button title="Upload now" onPress={onUploadNow} style={styles.btn} />
      </View>

      {/* Dev: API URL */}
      <Text style={styles.section}>SERVER</Text>
      <View style={styles.card}>
        <Text style={styles.rowLabel}>API base URL</Text>
        <TextInput
          value={apiUrlDraft}
          onChangeText={setApiUrlDraft}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
          placeholderTextColor={c.textSubtle}
        />
        <Button title="Save URL" variant="secondary" onPress={() => void onSaveApiUrl()} style={styles.btn} />
      </View>

      <Button title="Re-register device" variant="destructive" onPress={onReRegister} style={styles.btn} />
    </ScrollView>
  );
}

function Row({ label, value, c, mono }: { label: string; value: string; c: Palette; mono?: boolean }) {
  const t = makeType(c);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
      <Text style={{ ...t.small }}>{label}</Text>
      <Text style={[mono ? t.mono : t.body, { flexShrink: 1, textAlign: 'right', marginLeft: spacing.md }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette) => {
  const t = makeType(c);
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: spacing.lg, gap: spacing.sm },
    section: { ...t.sectionLabel, marginTop: spacing.md, marginBottom: spacing.xs },
    card: { backgroundColor: c.surface, borderRadius: radii.lg, padding: spacing.md, gap: spacing.xs },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { ...t.body },
    warn: { ...t.small, color: c.warning, marginTop: spacing.xs },
    error: { ...t.small, color: c.danger, marginTop: spacing.xs },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: c.text,
      fontSize: 15,
      marginTop: spacing.xs,
    },
    btn: { marginTop: spacing.sm },
  });
};
