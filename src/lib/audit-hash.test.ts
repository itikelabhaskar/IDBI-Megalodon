import { describe, it, expect } from "vitest";
import { chainAudit, verifyChain, fnv1a, GENESIS_HASH } from "./audit-hash";

describe("tamper-evident audit chain", () => {
  const events = [
    { ts: "2026-06-28T09:14:00Z", actor: "system", action: "AA consent received", detail: "x" },
    { ts: "2026-06-28T09:14:22Z", actor: "system", action: "Data fetched", detail: "6 sources" },
    { ts: "2026-06-28T09:14:23Z", actor: "engine", action: "HealthScore computed", detail: "72" },
  ];

  it("links each event to the previous hash, starting at GENESIS", () => {
    const chained = chainAudit(events);
    expect(chained[0].prevHash).toBe(GENESIS_HASH);
    expect(chained[1].prevHash).toBe(chained[0].hash);
    expect(chained[2].prevHash).toBe(chained[1].hash);
    expect(chained.every((e) => /^[0-9a-f]{8}$/.test(e.hash!))).toBe(true);
  });

  it("is deterministic", () => {
    expect(JSON.stringify(chainAudit(events))).toBe(JSON.stringify(chainAudit(events)));
    expect(fnv1a("abc")).toBe(fnv1a("abc"));
  });

  it("verifies a clean chain and pinpoints tampering", () => {
    const chained = chainAudit(events);
    expect(verifyChain(chained)).toBe(-1);
    const tampered = chained.map((e) => ({ ...e }));
    tampered[1] = { ...tampered[1], detail: "tampered" };
    expect(verifyChain(tampered)).toBe(1); // first broken link is the edited event
  });
});
