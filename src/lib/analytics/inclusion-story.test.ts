import { describe, it, expect } from "vitest";
import { inclusionFunnelStory } from "./inclusion-story";
import { getAllCases } from "../data/dataset";
import type { MsmeCase } from "../types";

describe("inclusionFunnelStory", () => {
  it("runs on the synthetic portfolio with funnel fields", () => {
    const story = inclusionFunnelStory(getAllCases());
    expect(story.ntcCount).toBeGreaterThan(0);
    expect(story.inclusionLiftPct).toBeGreaterThanOrEqual(0);
    expect(story.bureauOnlyRejectPct).toBe(100);
    expect(story.rescuedToAdvance).toBe(story.approveOrRefer);
    expect(story.incompleteCount).toBeGreaterThanOrEqual(0);
    expect(story.headline).toMatch(/credit-invisible|No NTC/i);
    expect(story.note.length).toBeGreaterThan(10);
  });

  it("handles empty NTC book", () => {
    const nonNtc = getAllCases()
      .filter((c) => !c.ntcNtb)
      .slice(0, 3) as MsmeCase[];
    const story = inclusionFunnelStory(nonNtc);
    expect(story.ntcCount).toBe(0);
    expect(story.headline).toMatch(/No NTC/);
    expect(story.rescuedToAdvance).toBe(0);
  });

  it("counts Incomplete among NTC", () => {
    const cases = getAllCases();
    const story = inclusionFunnelStory(cases);
    const expected = cases.filter((c) => c.ntcNtb && c.decision === "Incomplete").length;
    expect(story.incompleteCount).toBe(expected);
  });
});
