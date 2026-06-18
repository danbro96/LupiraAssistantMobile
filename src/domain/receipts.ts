// Wire types for ingest receipts + cursor/state responses. camelCase, matching the server's default
// System.Text.Json output.

/** Per-row rejection reason codes returned by the server. `seq` is null for batch-level rejects. */
export type RejectReason =
  | 'invalid_json'
  | 'missing_seq'
  | 'invalid_ts'
  | 'ts_out_of_range'
  | 'missing_latlon'
  | 'invalid_latlon'
  | 'batch_too_large'
  | 'body_ids_forbidden'
  | 'unknown_kind'
  | 'missing_value'
  | 'missing_kind'
  | 'invalid_period_start'
  | 'invalid_period_end'
  | 'missing_payload';

export interface IngestReject {
  seq: number | null;
  reason: RejectReason | string;
}

/** Common receipt fields shared by all ingest endpoints. */
export interface IngestReceiptBase {
  submitted: number;
  inserted: number;
  duplicates: number;
  rejected: number;
  highWaterSeq: number | null;
  rejects: IngestReject[];
}

/** Location ingest adds `paused` (the kill-switch signal); ring/summaries receipts do not. */
export interface LocationIngestReceipt extends IngestReceiptBase {
  paused: boolean;
}

export type RingIngestReceipt = IngestReceiptBase;
export type SummariesIngestReceipt = IngestReceiptBase;

export interface LocationCursor {
  deviceId: string;
  lastSeq: number | null;
  lastTs: string | null;
}

export interface TrackingState {
  deviceId: string;
  paused: boolean;
  pausedAt: string | null;
  reason: string | null;
}
