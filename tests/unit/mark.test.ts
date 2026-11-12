import { describe, expect, it } from "vitest";
import { LIGHT_BOX, LIGHTS, markBody, markSvg } from "../../src/lib/mark.ts";
import { GLYPHS, PROJECTS } from "../../src/projects.ts";

describe("the mark", () => {
  it.each(GLYPHS)("draws %s's light inside the courtyard", (glyph) => {
    const body = markBody(glyph);
    expect(body).toContain('class="mark-ring"');
    expect(body).toContain(LIGHTS[glyph]);
  });

  it.each(GLYPHS)("%s's light alone carries no courtyard", (glyph) => {
    expect(LIGHTS[glyph]).not.toContain("mark-ring");
  });

  it.each(GLYPHS)("%s's light fits the frame it is shown in without its courtyard", (glyph) => {
    const [left = 0, top = 0, width = 0, height = 0] = LIGHT_BOX.split(" ").map(Number);
    const numbers = (attribute: string) =>
      [...LIGHTS[glyph].matchAll(new RegExp(`\\b${attribute}="([\\d.]+)"`, "g"))].map(([, value]) => Number(value));
    for (const x of [...numbers("x"), ...numbers("cx")]) {
      expect(x).toBeGreaterThanOrEqual(left);
      expect(x).toBeLessThanOrEqual(left + width);
    }
    for (const y of [...numbers("y"), ...numbers("cy")]) {
      expect(y).toBeGreaterThanOrEqual(top);
      expect(y).toBeLessThanOrEqual(top + height);
    }
  });

  it("gives every project a light", () => {
    for (const project of PROJECTS) expect(LIGHTS[project.glyph], project.name).toBeTruthy();
  });

  it("is a standalone file that follows the color scheme, for favicons", () => {
    const skift = PROJECTS.find((project) => project.id === "skift");
    if (!skift) throw new Error("skift is missing from the registry");
    const svg = markSvg(skift, { light: "#1C1A17", dark: "#EFE6D2" });
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(skift.color.light);
    expect(svg).toContain(`@media (prefers-color-scheme:dark)`);
    expect(svg).toContain(skift.color.dark);
  });
});
