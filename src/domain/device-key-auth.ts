// Build the ingest Authorization header. The apiKey is already the `{keyId:N}.{secret}` string the
// server issued at registration — send it verbatim. Pure (and unit-tested) so the exact format can't
// drift. The header value itself is never logged (the debug logger also redacts it defensively).

export function buildDeviceKeyHeader(apiKey: string): string {
  return `DeviceKey ${apiKey}`;
}
