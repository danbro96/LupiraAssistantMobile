import type { IngestReceiptBase, LocationIngestReceipt } from './receipts';
import { isPermanentReject } from './reject-reasons';

// The pure core of the uploader: given a 202 receipt and the seqs we sent, decide which buffered rows
// to delete (confirmed), which to drop as permanently rejected, how far the high-water advances, and
// whether the server is paused. Idempotent server semantics make this safe: `inserted` AND
// `duplicates` are both confirmed-on-server, so both are deleted locally.

export interface ApplyPlan {
  /** Rows confirmed on the server (inserted or duplicate) — delete from the buffer. */
  deleteSeqs: number[];
  /** Permanently-rejected rows — mark rejected (kept for diagnostics, removed from pending). */
  dropRejectSeqs: number[];
  /** Highest resolved seq (confirmed or permanently dropped), for the last-uploaded high-water; null if none. */
  advanceTo: number | null;
  /** Server pause signal (location receipts only; treated false for ring/summaries). */
  paused: boolean;
  /** The batch exceeded the server cap — shrink next time (not a per-row drop). */
  batchTooLarge: boolean;
}

function isLocationReceipt(r: IngestReceiptBase | LocationIngestReceipt): r is LocationIngestReceipt {
  return 'paused' in r;
}

export function applyReceipt(
  receipt: IngestReceiptBase | LocationIngestReceipt,
  sentSeqs: readonly number[],
): ApplyPlan {
  const paused = isLocationReceipt(receipt) ? receipt.paused : false;
  if (paused) {
    // Body was discarded server-side; keep the buffered rows and stop. They'll upload on resume.
    return { deleteSeqs: [], dropRejectSeqs: [], advanceTo: null, paused: true, batchTooLarge: false };
  }

  const rejectBySeq = new Map<number, string>();
  let batchTooLarge = false;
  for (const r of receipt.rejects) {
    if (r.reason === 'batch_too_large') {
      batchTooLarge = true;
      continue;
    }
    if (r.seq !== null) rejectBySeq.set(r.seq, r.reason);
  }

  const deleteSeqs: number[] = [];
  const dropRejectSeqs: number[] = [];
  for (const seq of sentSeqs) {
    const reason = rejectBySeq.get(seq);
    if (reason === undefined) {
      deleteSeqs.push(seq); // inserted or duplicate → confirmed
    } else if (isPermanentReject(reason)) {
      dropRejectSeqs.push(seq); // permanent → drop
    }
    // transient reject → leave buffered for retry
  }

  const resolved = [...deleteSeqs, ...dropRejectSeqs];
  const advanceTo = resolved.length > 0 ? Math.max(...resolved) : null;
  return { deleteSeqs, dropRejectSeqs, advanceTo, paused: false, batchTooLarge };
}
