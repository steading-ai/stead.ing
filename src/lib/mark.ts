/**
 * The courtyard mark as SVG: a ring of buildings with one side open, and a
 * light in the middle that takes each project's shape. Drawn on a 120 by 120
 * grid. The ring uses the class `mark-ring`, the light `mark-fill` or
 * `mark-stroke`; whoever embeds the mark decides what colors those are.
 */
import type { Glyph, Project } from "../projects.ts";

export const RING = [
  '<rect x="10" y="10" width="100" height="18"/>',
  '<rect x="10" y="10" width="18" height="100"/>',
  '<rect x="92" y="10" width="18" height="100"/>',
  '<rect x="10" y="92" width="32" height="18"/>',
  '<rect x="78" y="92" width="32" height="18"/>',
].join("");

export const LIGHTS: Record<Glyph, string> = {
  console: '<circle class="mark-fill" cx="60" cy="58" r="10"/>',
  skift:
    '<path class="mark-stroke" d="M48 50 L60 69 M72 50 L60 69" stroke-width="4"/>' +
    '<circle class="mark-fill" cx="48" cy="49" r="7"/><circle class="mark-fill" cx="72" cy="49" r="7"/><circle class="mark-fill" cx="60" cy="70" r="7"/>',
  mill: '<circle class="mark-stroke" cx="60" cy="58" r="12" stroke-width="6"/><circle class="mark-fill" cx="60" cy="58" r="3.5"/>',
  croft:
    '<g class="mark-fill"><rect x="44" y="45" width="7" height="26"/><rect x="56.5" y="45" width="7" height="26"/>' +
    '<rect x="69" y="45" width="7" height="26"/><rect x="44" y="54" width="32" height="5"/></g>',
  almanac:
    '<rect class="mark-stroke" x="45" y="45" width="30" height="27" stroke-width="5"/>' +
    '<rect class="mark-fill" x="45" y="45" width="30" height="10"/>',
  thicket:
    '<g class="mark-fill"><circle cx="51" cy="65" r="9"/><circle cx="69" cy="65" r="9"/><circle cx="60" cy="49" r="9"/></g>',
  fallow: '<path class="mark-stroke" d="M44 48 H76 M44 58 H76 M44 68 H76" stroke-width="5"/>',
  stead:
    '<path class="mark-stroke" d="M47 49 L60 63 L73 49" stroke-width="6" stroke-linecap="square"/>' +
    '<path class="mark-stroke" d="M60 63 V76" stroke-width="6"/>',
  gateway: '<g class="mark-fill"><circle cx="60" cy="51" r="8"/><path d="M55 55 H65 L68 72 H52 Z"/></g>',
  knowledge:
    '<path class="mark-stroke" d="M44 48 L60 54 L76 48 V69 L60 75 L44 69 Z" stroke-width="4.5" stroke-linejoin="round"/>' +
    '<path class="mark-stroke" d="M60 54 V75" stroke-width="3.5"/>',
};

/** The inside of a mark's `<svg>` element. */
export const markBody = (glyph: Glyph) => `<g class="mark-ring">${RING}</g>${LIGHTS[glyph]}`;

/** A standalone SVG file of a project's mark that follows the viewer's color scheme, for favicons. */
export function markSvg(project: Project, ink: { light: string; dark: string }): string {
  const style = (ring: string, light: string) =>
    `.mark-ring,.mark-fill{stroke:none}.mark-ring{fill:${ring}}.mark-fill{fill:${light}}.mark-stroke{fill:none;stroke:${light}}`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">',
    `<style>${style(ink.light, project.color.light)}@media (prefers-color-scheme:dark){${style(ink.dark, project.color.dark)}}</style>`,
    markBody(project.glyph),
    "</svg>",
    "",
  ].join("");
}
