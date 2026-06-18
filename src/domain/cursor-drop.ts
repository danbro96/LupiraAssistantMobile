// On launch / reconnect we fetch the server cursor and drop any buffered fix the server has already
// accepted (seq <= lastSeq) so we don't re-send it. Pure decision; the SQL DELETE lives in the repo.

/** Seqs to drop given the server's last accepted seq. Null cursor (nothing accepted yet) drops none. */
export function dropSeqsUpTo(bufferSeqs: readonly number[], lastSeq: number | null): number[] {
  if (lastSeq === null) return [];
  return bufferSeqs.filter((s) => s <= lastSeq);
}

/** Whether a single buffered seq is already covered by the server cursor. */
export function isCoveredByCursor(seq: number, lastSeq: number | null): boolean {
  return lastSeq !== null && seq <= lastSeq;
}
