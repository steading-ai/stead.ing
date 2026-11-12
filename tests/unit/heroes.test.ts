import { describe, expect, it } from "vitest";
import { GRID, YARD } from "../../src/lib/field.ts";
import { CHAIN_SLOTS, chains, lanes, plan, PLAN_LAYERS, rimShipments, WIDE } from "../../src/lib/heroes.ts";

const PALETTE = ["skift", "mill", "croft"];

describe("the wide canvas", () => {
  it("holds exactly a thousand agents", () => {
    expect(WIDE.agents * WIDE.rows).toBe(1000);
  });
});

describe("outward", () => {
  it("merges changes only at the rim, one cell each", () => {
    const shipped = rimShipments();
    const edge = (value: number) => value <= 1 || value >= GRID - 2;
    for (const cell of shipped) expect(edge(cell.x) || edge(cell.y)).toBe(true);
    expect(new Set(shipped.map((cell) => `${cell.x},${cell.y}`)).size).toBe(shipped.length);
  });
});

describe("stream", () => {
  const drawn = lanes(PALETTE);

  it("runs one lane per row", () => {
    expect(drawn.map((lane) => lane.row)).toEqual(Array.from({ length: WIDE.rows }, (_, row) => row));
  });

  it("merges each lane's changes in order, and never more than fit", () => {
    for (const lane of drawn) {
      expect(lane.shipped.length).toBeLessThanOrEqual(WIDE.out);
      expect([...lane.shipped].sort((a, b) => a - b)).toEqual(lane.shipped);
      expect(lane.shipped[0]).toBeGreaterThan(0);
    }
  });
});

describe("plan", () => {
  const { nodes, edges } = plan(PALETTE);

  it("has the tasks its layers say", () => {
    expect(nodes).toHaveLength(PLAN_LAYERS.reduce((total, count) => total + count, 0));
  });

  it("keeps every task inside the field", () => {
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + 1).toBeLessThan(WIDE.agents);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y + 1).toBeLessThan(WIDE.rows);
    }
  });

  it("leaves no task unreachable and none a dead end", () => {
    const center = (node: { x: number; y: number }) => `${node.x + 1},${node.y + 1}`;
    for (const node of nodes) {
      const key = center(node);
      if (node.layer > 0) {
        expect(edges.some((edge) => edge.layer === node.layer - 1 && `${edge.to.x},${edge.to.y}` === key)).toBe(true);
      }
      if (node.layer < PLAN_LAYERS.length - 1) {
        expect(edges.some((edge) => edge.layer === node.layer && `${edge.from.x},${edge.from.y}` === key)).toBe(true);
      }
    }
  });
});

describe("chains", () => {
  const drawn = chains();
  const start = (GRID - YARD) / 2;

  it("draws the chains asked for", () => {
    expect(drawn).toHaveLength(18);
  });

  it("keeps every step in the field, out of the courtyard, and on a cell of its own", () => {
    const seen = new Set<string>();
    for (const step of drawn.flatMap((chain) => chain.steps)) {
      expect(step.x >= 0 && step.x < GRID && step.y >= 0 && step.y < GRID).toBe(true);
      expect(step.x >= start && step.x < start + YARD && step.y >= start && step.y < start + YARD).toBe(false);
      expect(seen.has(`${step.x},${step.y}`)).toBe(false);
      seen.add(`${step.x},${step.y}`);
    }
  });

  it("moves one cell at a time and ends in a merge", () => {
    for (const chain of drawn) {
      for (let index = 1; index < chain.steps.length; index++) {
        const [a, b] = [chain.steps[index - 1], chain.steps[index]];
        if (!a || !b) throw new Error("a chain has a missing step");
        expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
        expect(b.slot).toBeGreaterThan(a.slot);
      }
      expect(chain.steps.at(-1)?.role).toBe("merged");
      expect(chain.steps.at(-1)?.slot).toBeLessThanOrEqual(CHAIN_SLOTS);
    }
  });

  it("stops some chains at a question", () => {
    expect(drawn.some((chain) => chain.steps.some((step) => step.role === "ask"))).toBe(true);
  });
});
