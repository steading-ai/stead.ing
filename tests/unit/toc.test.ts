import { describe, expect, it } from "vitest";
import { contents, headingAt } from "../../src/lib/toc.ts";

const heading = (depth: number, text: string) => ({ depth, slug: text.toLowerCase(), text });

describe("contents", () => {
  it("lists a page's sections and their subsections, and nothing deeper or shallower", () => {
    const listed = contents([heading(1, "Title"), heading(2, "Install"), heading(3, "With mise"), heading(4, "On macOS"), heading(2, "Check")]);
    expect(listed.map((entry) => entry.text)).toEqual(["Install", "With mise", "Check"]);
  });

  it("is empty for a page with too few sections to need a list", () => {
    expect(contents([heading(1, "Title"), heading(2, "Only")])).toEqual([]);
    expect(contents([])).toEqual([]);
  });
});

describe("headingAt", () => {
  const line = 120;

  it("is no heading above the first", () => {
    expect(headingAt([400, 900, 1500], line)).toBe(-1);
  });

  it("is the last heading at or above the line the reader reads from", () => {
    expect(headingAt([-300, 120, 700], line)).toBe(1);
    expect(headingAt([-900, -200, 121], line)).toBe(1);
    expect(headingAt([-900, -200, 17], line)).toBe(2);
  });

  it("is the last heading at the foot of the page, though it never reached the line", () => {
    expect(headingAt([-900, 300, 600], line, true)).toBe(2);
  });
});
