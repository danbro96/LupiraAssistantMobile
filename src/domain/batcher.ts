// Select an upload batch bounded by BOTH line count and byte size, preserving seq order. The server
// caps a request at 10,000 lines; we stay well under and also cap bytes (<5 MB). Pure.

export interface BatchItem {
  seq: number;
  /** The already-serialized single-line JSON for this row. */
  json: string;
  /** UTF-8 byte length of `json`. */
  bytes: number;
}

export interface BatchLimits {
  maxLines: number;
  maxBytes: number;
}

/**
 * Take the longest seq-ordered prefix of `items` that fits within `maxLines` and `maxBytes`
 * (accounting for one '\n' separator between rows). Always includes at least the first row even if it
 * alone exceeds maxBytes — a single NDJSON line cannot be split.
 */
export function selectBatch(items: readonly BatchItem[], limits: BatchLimits): BatchItem[] {
  const out: BatchItem[] = [];
  let bytes = 0;
  for (const it of items) {
    if (out.length >= limits.maxLines) break;
    const add = it.bytes + (out.length > 0 ? 1 : 0); // +1 for the joining newline
    if (out.length > 0 && bytes + add > limits.maxBytes) break;
    out.push(it);
    bytes += add;
  }
  return out;
}
