import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast, THEMES, type ThemeName } from "../../src/lib/color.ts";
import { ALL } from "../../src/projects.ts";

// WCAG 2.2 AA: 4.5:1 for text, 3:1 for the parts of a graphic needed to read it.
const TEXT = 4.5;
const GRAPHIC = 3;

describe("contrast arithmetic", () => {
  it("matches the WCAG reference values", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
});

for (const name of Object.keys(THEMES) as ThemeName[]) {
  const theme = THEMES[name];

  describe(`${name} theme`, () => {
    it.each(["ground", "surface"] as const)("body text is readable on %s", (background) => {
      expect(contrast(theme.ink, theme[background])).toBeGreaterThanOrEqual(TEXT);
      expect(contrast(theme.muted, theme[background])).toBeGreaterThanOrEqual(TEXT);
    });

    it("the primary button's label is readable on ember", () => {
      expect(contrast(theme.onEmber, theme.ember)).toBeGreaterThanOrEqual(TEXT);
    });

    it("ember is visible as a focus ring and an underline", () => {
      expect(contrast(theme.ember, theme.ground)).toBeGreaterThanOrEqual(GRAPHIC);
      expect(contrast(theme.ember, theme.surface)).toBeGreaterThanOrEqual(GRAPHIC);
    });

    it.each(ALL.map((project) => [project.id, project.color[name]] as const))(
      "the primary button's label is readable on %s's color",
      (_id, color) => {
        expect(contrast(theme.onEmber, color)).toBeGreaterThanOrEqual(TEXT);
      },
    );

    it.each(ALL.map((project) => [project.id, project.color[name]] as const))(
      "%s's color is visible on the ground and on a card",
      (_id, color) => {
        expect(contrast(color, theme.ground)).toBeGreaterThanOrEqual(GRAPHIC);
        expect(contrast(color, theme.surface)).toBeGreaterThanOrEqual(GRAPHIC);
      },
    );
  });
}

describe("global.css", () => {
  const css = readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf8").toLowerCase();
  const [light = "", dark = ""] = css.split("@media (prefers-color-scheme: dark) {");
  const variables = { ground: "--ground", surface: "--surface", ink: "--ink", muted: "--muted", line: "--line", ember: "--ember", onEmber: "--on-ember" };

  it.each(Object.entries(variables))("declares %s as color.ts does, in both themes", (key, variable) => {
    const token = key as keyof typeof THEMES.light;
    expect(light).toContain(`${variable}: ${THEMES.light[token].toLowerCase()};`);
    expect(dark).toContain(`${variable}: ${THEMES.dark[token].toLowerCase()};`);
  });
});
