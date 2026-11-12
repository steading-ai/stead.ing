/**
 * The drawings behind the hero variations. Each is generated once, from a
 * seed, so a build always draws the same picture. Everything is in grid
 * steps; the components multiply by PITCH.
 */
import { field, GRID, mulberry32, YARD } from "./field.ts";

const pick = <T,>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;

/* ------------------------------------------------------------------ Outward */

export interface Shipped {
  x: number;
  y: number;
  /** Seconds after the page loads at which the change merges. */
  at: number;
}

/** Cells on the field's rim that turn solid one by one: merged changes. */
export function rimShipments(count = 44, seed = 7): Shipped[] {
  const random = mulberry32(seed);
  const rim = field([]).filter((cell) => cell.ring >= 9);
  const chosen = new Map<string, Shipped>();
  while (chosen.size < count) {
    const cell = pick(random, rim);
    chosen.set(`${cell.x},${cell.y}`, { x: cell.x, y: cell.y, at: 2 + random() * 14 });
  }
  return [...chosen.values()].sort((a, b) => a.at - b.at);
}

/* ------------------------------------------------------------------- Stream */

/** The wide canvas the Stream and Plan variations share: a source, a thousand agents, and what ships. */
export const WIDE = {
  rows: 20,
  /** Columns holding the courtyard and incoming events. */
  source: 6,
  gap: 2,
  /** Columns of agents: 50 by 20 rows is a thousand. */
  agents: 50,
  /** Columns where merged changes collect. */
  out: 8,
} as const;

export const WIDE_COLS = WIDE.source + WIDE.gap + WIDE.agents + WIDE.gap + WIDE.out;
export const AGENTS_X = WIDE.source + WIDE.gap;
export const OUT_X = AGENTS_X + WIDE.agents + WIDE.gap;

export interface Lane {
  row: number;
  color: string;
  /** Seconds for work to cross the field. */
  duration: number;
  /** How far into its crossing the lane is when the page loads, in seconds. */
  offset: number;
  /** When each merged change in this lane appears, in seconds. */
  shipped: number[];
}

export function lanes(palette: readonly string[], seed = 21): Lane[] {
  const random = mulberry32(seed);
  return Array.from({ length: WIDE.rows }, (_, row) => {
    const duration = 5 + random() * 5;
    const offset = random() * duration;
    const count = 2 + Math.floor(random() * (WIDE.out - 2));
    const first = duration - offset;
    return {
      row,
      color: palette[row % palette.length] as string,
      duration,
      offset,
      shipped: Array.from({ length: count }, (_, index) => first + index * duration),
    };
  });
}

/** Things arriving from the world, beside the courtyard: each blinks as it comes in. */
export function arrivals(seed = 5): { x: number; y: number; at: number }[] {
  const random = mulberry32(seed);
  const rows = [1, 3, 4, 15, 17, 18];
  return rows.map((y) => ({ x: Math.floor(random() * (WIDE.source - 1)), y, at: random() * 6 }));
}

/* --------------------------------------------------------------------- Plan */

export interface PlanNode {
  id: number;
  layer: number;
  /** Top-left cell of the node's two-by-two block, within the field of agents. */
  x: number;
  y: number;
  color: string;
}

export interface PlanEdge {
  layer: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export const PLAN_LAYERS = [2, 4, 6, 7, 6, 4, 2] as const;

export function plan(palette: readonly string[], seed = 33): { nodes: PlanNode[]; edges: PlanEdge[] } {
  const random = mulberry32(seed);
  const step = WIDE.agents / PLAN_LAYERS.length;
  const layers = PLAN_LAYERS.map((count, layer) =>
    Array.from({ length: count }, (_, index) => ({
      id: 0,
      layer,
      x: Math.round(step * layer + step / 2) - 1,
      y: Math.round(((index + 0.5) * WIDE.rows) / count) - 1,
      color: pick(random, palette),
    })),
  );
  const nodes = layers.flat().map((node, id) => ({ ...node, id }));
  const center = (node: { x: number; y: number }) => ({ x: node.x + 1, y: node.y + 1 });
  const edges: PlanEdge[] = [];
  for (let layer = 0; layer < layers.length - 1; layer++) {
    const here = layers[layer] as PlanNode[];
    const next = layers[layer + 1] as PlanNode[];
    // Every task ahead depends on its nearest task behind, and some on a second.
    for (const target of next) {
      const ranked = [...here].sort((a, b) => Math.abs(a.y - target.y) - Math.abs(b.y - target.y));
      const sources = random() < 0.45 && ranked.length > 1 ? ranked.slice(0, 2) : ranked.slice(0, 1);
      for (const source of sources) edges.push({ layer, from: center(source), to: center(target) });
    }
    // And no task is left without something depending on it.
    for (const source of here) {
      if (edges.some((edge) => edge.layer === layer && edge.from.y === center(source).y)) continue;
      const nearest = [...next].sort((a, b) => Math.abs(a.y - source.y) - Math.abs(b.y - source.y))[0] as PlanNode;
      edges.push({ layer, from: center(source), to: center(nearest) });
    }
  }
  return { nodes, edges };
}

/* ------------------------------------------------------------------- Chains */

export interface Chain {
  /** Seconds into the loop at which the chain starts. */
  offset: number;
  steps: { x: number; y: number; role: string; slot: number }[];
}

/**
 * Chains of adjacent cells across the square field. Each is one piece of work
 * moving through the projects: something is noticed or said, a task is filed,
 * the work is done, the change merges. A few stop at a question for a person.
 */
export function chains(count = 18, seed = 12): Chain[] {
  const random = mulberry32(seed);
  const start = (GRID - YARD) / 2;
  const taken = new Set<string>();
  const free = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < GRID &&
    y < GRID &&
    !(x >= start && x < start + YARD && y >= start && y < start + YARD) &&
    !taken.has(`${x},${y}`);
  const result: Chain[] = [];
  let attempts = 0;
  while (result.length < count && attempts++ < 4000) {
    const asks = result.length % 5 === 4;
    const roles = [
      result.length % 2 === 0 ? "almanac" : "thicket",
      "skift",
      "mill",
      ...(asks ? ["ask"] : []),
      "mill",
      "mill",
      "merged",
    ];
    let x = Math.floor(random() * GRID);
    let y = Math.floor(random() * GRID);
    const cells: { x: number; y: number }[] = [];
    const visited = new Set<string>();
    while (cells.length < roles.length && free(x, y) && !visited.has(`${x},${y}`)) {
      cells.push({ x, y });
      visited.add(`${x},${y}`);
      const moves = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
        [1, 0],
      ] as const;
      const [dx, dy] = pick(random, moves);
      x += dx;
      y += dy;
    }
    if (cells.length < roles.length) continue;
    // Keep a clear cell around each chain so two never read as one.
    for (const cell of cells) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) taken.add(`${cell.x + dx},${cell.y + dy}`);
    }
    let slot = 0;
    const steps = cells.map((cell, index) => {
      const role = roles[index] as string;
      const step = { ...cell, role, slot };
      // A question waits for its answer before the work goes on.
      slot += role === "ask" ? 4 : 1;
      return step;
    });
    result.push({ offset: random() * 11, steps });
  }
  return result;
}

/** The latest slot any chain reaches. */
export const CHAIN_SLOTS = 10;
