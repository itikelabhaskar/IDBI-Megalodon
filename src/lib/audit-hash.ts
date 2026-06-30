// Tamper-evident audit chaining. Each audit event carries the hash of the
// previous event, so any retroactive edit to an earlier event breaks every
// downstream hash — a lightweight, dependency-free integrity guarantee suitable
// for a bank-grade decision trail (a pilot would swap this for a signed/WORM log).

import type { AuditEvent } from "./types";

export const GENESIS_HASH = "GENESIS";

/** Deterministic 32-bit FNV-1a, rendered as 8 hex chars. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function canonical(e: Pick<AuditEvent, "ts" | "actor" | "action" | "detail">): string {
  return `${e.ts}|${e.actor}|${e.action}|${e.detail ?? ""}`;
}

/** Attach a forward hash chain to a list of audit events (pure, deterministic). */
export function chainAudit(
  events: Pick<AuditEvent, "ts" | "actor" | "action" | "detail">[],
): AuditEvent[] {
  let prevHash = GENESIS_HASH;
  return events.map((e) => {
    const hash = fnv1a(`${prevHash}|${canonical(e)}`);
    const withHash: AuditEvent = { ...e, prevHash, hash };
    prevHash = hash;
    return withHash;
  });
}

/** Verify a chain end-to-end; returns the index of the first broken link or -1. */
export function verifyChain(events: AuditEvent[]): number {
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const expected = fnv1a(`${prevHash}|${canonical(e)}`);
    if (e.prevHash !== prevHash || e.hash !== expected) return i;
    prevHash = e.hash!;
  }
  return -1;
}
