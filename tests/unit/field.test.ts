import { describe, expect, it } from "vitest";
import { field, GRID, groups, YARD } from "../../src/lib/field.ts";

const PALETTE = ["skift", "mill", "croft"];

describe("the field", () => {
  const cells = field(PALETTE);

  it("has exactly a thousand cells", () => {
    expect(cells).toHaveLength(1000);
  });

  it("leaves the courtyard open", () => {
    const start = (GRID - YARD) / 2;
    const inside = cells.filter((cell) => cell.x >= start && cell.x < start + YARD && cell.y >= start && cell.y < start + YARD);
    expect(inside).toEqual([]);
  });

  it("lights some cells, each in a color from the palette", () => {
    const lit = cells.filter((cell) => cell.color !== undefined);
    expect(lit.length).toBeGreaterThan(250);
    expect(lit.length).toBeLessThan(450);
    for (const cell of lit) expect(PALETTE).toContain(cell.color);
    for (const color of PALETTE) expect(lit.some((cell) => cell.color === color)).toBe(true);
  });

  it("is the same field every time", () => {
    expect(field(PALETTE)).toEqual(cells);
  });

  it("numbers rings outward from the courtyard", () => {
    expect(Math.min(...cells.map((cell) => cell.ring))).toBe(1);
    expect(Math.max(...cells.map((cell) => cell.ring))).toBe((GRID - YARD) / 2);
  });
});

describe("groups", () => {
  it("draws every cell exactly once", () => {
    const squares = groups(field(PALETTE)).reduce((total, group) => total + (group.d.match(/M/g)?.length ?? 0), 0);
    expect(squares).toBe(1000);
  });
});
