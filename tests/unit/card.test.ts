import { describe, expect, it } from "vitest";
import { colored, headlineSize, lines, tint, words } from "../../src/lib/card.ts";

describe("the shared card's headline", () => {
  it("leans on the words the headline marks with emphasis", () => {
    expect(words("You and a *thousand* agents.")).toEqual([
      { text: "You", italic: false },
      { text: "and", italic: false },
      { text: "a", italic: false },
      { text: "thousand", italic: true },
      { text: "agents.", italic: false },
    ]);
  });

  it("wraps at spaces, a monospaced letter at a time", () => {
    // At 100px a letter is 58px wide, so 640px holds 11 letters a line.
    expect(lines(words("aaaa bbbb cccc"), 100, 640)).toBe(2);
    expect(lines(words("aaaaaaaaaaa"), 100, 640)).toBe(1);
  });

  it("is set as large as it can be in three lines, and smaller only when it must", () => {
    expect(headlineSize(words("You and a *thousand* agents."))).toBe(76);
    const long = words("Agents on the systems you run, reachable from Slack or a phone call.");
    expect(lines(long, headlineSize(long))).toBeLessThanOrEqual(3);
    expect(headlineSize(long)).toBeLessThan(76);
    expect(headlineSize(words("word ".repeat(60)))).toBe(46);
  });
});

describe("the shared card's colors", () => {
  it("mixes a color into the surface", () => {
    expect(tint("#000000", 0, "#FFFFFF")).toBe("#ffffff");
    expect(tint("#000000", 1, "#FFFFFF")).toBe("#000000");
    expect(tint("#FF0000", 0.5, "#000000")).toBe("#800000");
  });

  it("writes each mark's colors on its shapes, since a style would reach every mark on the card", () => {
    const body = '<g class="mark-ring"><rect/></g><circle class="mark-fill"/><path class="mark-stroke"/>';
    const out = colored(body, "#123456", "#000000");
    expect(out).not.toContain("class=");
    expect(out).toContain('fill="#000000"');
    expect(out).toContain('<circle fill="#123456"/>');
    expect(out).toContain('fill="none" stroke="#123456"');
  });
});
