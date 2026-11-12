/**
 * The picture of the tagline: a courtyard with one light, in a field of
 * exactly a thousand cells. The field is a 35 by 35 grid with the middle 15 by
 * 15 left open for the courtyard, and 35² − 15² is 1000.
 */

export const GRID = 35;
export const YARD = 15;
/** Size of one grid step in the drawing's units, and of the square drawn in it. */
export const PITCH = 10;
export const CELL = 6.4;

const YARD_START = (GRID - YARD) / 2;
const YARD_END = YARD_START + YARD - 1;

export interface Cell {
  x: number;
  y: number;
  /** How many steps out from the courtyard the cell sits, from 1. The light reaches nearer cells first. */
  ring: number;
  /** A palette entry for a cell that is lit in a project's color, or undefined for a quiet one. */
  color: string | undefined;
}

/** Small seeded generator, so the same field is drawn on every build. */
export function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The thousand cells. `palette` names the colors a lit cell may take, and
 * `lit` is the share of cells that are lit.
 */
export function field(palette: readonly string[], lit = 0.34, seed = 1000): Cell[] {
  const random = mulberry32(seed);
  const cells: Cell[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const ring = Math.max(YARD_START - x, x - YARD_END, YARD_START - y, y - YARD_END);
      if (ring < 1) continue;
      const roll = random();
      const pick = random();
      const color = roll < lit ? palette[Math.floor(pick * palette.length)] : undefined;
      cells.push({ x, y, ring, color });
    }
  }
  return cells;
}

/** The path of one cell's square at a grid position. */
export function square(x: number, y: number): string {
  const inset = (PITCH - CELL) / 2;
  return `M${x * PITCH + inset} ${y * PITCH + inset}h${CELL}v${CELL}h-${CELL}z`;
}

export interface CellGroup {
  ring: number;
  color: string | undefined;
  /** One SVG path drawing every cell in the group. */
  d: string;
}

/** Cells gathered by ring and color, each group one path, so a thousand squares cost a few dozen elements. */
export function groups(cells: readonly Cell[]): CellGroup[] {
  const inset = (PITCH - CELL) / 2;
  const byKey = new Map<string, CellGroup>();
  for (const cell of cells) {
    const key = `${cell.ring}:${cell.color ?? ""}`;
    const group = byKey.get(key) ?? { ring: cell.ring, color: cell.color, d: "" };
    group.d += `M${cell.x * PITCH + inset} ${cell.y * PITCH + inset}h${CELL}v${CELL}h-${CELL}z`;
    byKey.set(key, group);
  }
  return [...byKey.values()].sort((a, b) => a.ring - b.ring);
}

/** Where the courtyard goes, in the drawing's units. */
export const YARD_BOX = { x: YARD_START * PITCH, y: YARD_START * PITCH, size: YARD * PITCH };
export const SIZE = GRID * PITCH;
