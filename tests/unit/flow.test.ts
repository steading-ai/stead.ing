import { describe, expect, it } from "vitest";
import { BURSTS, BUSY, CYCLE, during, EDGES, head, middle, NODES, points, SIZE, STEPS, STREAMS, travel } from "../../src/lib/flow.ts";

// The stops are the percentages that open a block, not the ones inside it.
const percents = (css: string) => [...css.matchAll(/([\d.]+)%(?=[,{])/g)].map(([, value]) => Number(value));

describe("the product map's loop", () => {
  it("keeps every project inside the drawing, without two overlapping", () => {
    const nodes = NODES;
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w).toBeLessThanOrEqual(SIZE.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y + node.h).toBeLessThanOrEqual(SIZE.height);
    }
    for (const a of nodes) {
      for (const b of nodes) {
        if (a === b) continue;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart, `${a.id} and ${b.id}`).toBe(true);
      }
    }
  });

  it("starts and ends every line on the edge of a project, never inside one", () => {
    const inside = ([x, y]: readonly [number, number]) => NODES.some((node) => x > node.x && x < node.x + node.w && y > node.y && y < node.y + node.h);
    const onEdge = ([x, y]: readonly [number, number]) =>
      NODES.some((node) => x >= node.x && x <= node.x + node.w && y >= node.y && y <= node.y + node.h && (x === node.x || x === node.x + node.w || y === node.y || y === node.y + node.h));
    for (const [name, edge] of Object.entries(EDGES)) {
      const corners = points(edge.d);
      for (const corner of corners) expect(inside(corner), name).toBe(false);
      // The person, the world, and the outside the gateway reaches are not projects, so those ends are free.
      if (name !== "you" && name !== "world") expect(onEdge(corners[0] ?? [0, 0]), `${name} start`).toBe(true);
      if (name !== "gatewayOut") expect(onEdge(corners.at(-1) ?? [0, 0]), `${name} end`).toBe(true);
    }
  });

  it("marks a line halfway along it, and points its arrowhead the way it runs", () => {
    expect(middle("M0 0H10")).toEqual([5, 0]);
    expect(middle("M0 0H10V30")).toEqual([10, 10]);
    expect(middle("M10 40V0")).toEqual([10, 20]);
    expect(head("M0 0H10", 4)).toBe("M10 0L6 2.8L6 -2.8Z");
    expect(head("M0 10V0", 4)).toBe("M0 0L-2.8 4L2.8 4Z");
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
    for (const css of [travel("t", 0, 0.6), travel("t", 9.7, 1.6), during("d", [[0.4, 1.9], [11, 12]]), ...STEPS.map((step) => during("s", [[step.from, step.to]]))]) {
      const stops = percents(css);
      expect([...stops].sort((a, b) => a - b)).toEqual(stops);
      expect(Math.max(...stops)).toBeLessThanOrEqual(100);
    }
  });
});
