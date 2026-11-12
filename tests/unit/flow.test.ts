import { describe, expect, it } from "vitest";
import { AROUND, BURSTS, BUSY, CORE, CYCLE, during, EDGES, shownDuring, SIZE, STEPS, STREAMS, travel } from "../../src/lib/flow.ts";

// The stops are the percentages that open a block, not the ones inside it.
const percents = (css: string) => [...css.matchAll(/([\d.]+)%(?=[,{])/g)].map(([, value]) => Number(value));

describe("the product map's loop", () => {
  it("keeps every project inside the drawing, without two overlapping", () => {
    const nodes = [...CORE, ...AROUND];
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w).toBeLessThanOrEqual(SIZE.width);
    }
    for (const a of nodes) {
      for (const b of nodes) {
        if (a === b) continue;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart, `${a.id} and ${b.id}`).toBe(true);
      }
    }
  });

  it("sends marks only along lines that exist, within one turn", () => {
    for (const burst of BURSTS) {
      expect(EDGES[burst.edge]).toBeDefined();
      expect(burst.from).toBeGreaterThanOrEqual(0);
      expect(burst.from + burst.takes + (burst.count - 1) * burst.gap).toBeLessThanOrEqual(CYCLE);
    }
    for (const stream of STREAMS) expect(stream.takes).toBeLessThan(stream.every);
  });

  it("lights projects and says its sentences only within the turn", () => {
    for (const spans of Object.values(BUSY)) {
      for (const [from, to] of spans) {
        expect(from).toBeGreaterThanOrEqual(0);
        expect(to).toBeLessThanOrEqual(CYCLE);
        expect(to).toBeGreaterThan(from);
      }
    }
    expect(STEPS[0]?.from).toBe(0);
    expect(STEPS.at(-1)?.to).toBe(CYCLE);
    for (let index = 1; index < STEPS.length; index++) expect(STEPS[index]?.from).toBe(STEPS[index - 1]?.to);
  });

  it("writes keyframes whose stops run in order", () => {
    for (const css of [travel("t", 0, 0.6), travel("t", 9.7, 1.6), during("d", [[0.4, 1.9], [11, 12]]), shownDuring("s", 0, 2.5), shownDuring("s", 9.7, 12)]) {
      const stops = percents(css);
      expect([...stops].sort((a, b) => a - b)).toEqual(stops);
      expect(Math.max(...stops)).toBeLessThanOrEqual(100);
    }
  });
});
