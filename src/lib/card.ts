/**
 * The picture a link to a site shows when it is shared: the site's mark and
 * name, its headline, and its address, with the projects' lights beside them.
 * Every site draws its own at build time. satori lays the card out and draws
 * its words as shapes in Plex; sharp turns that into a PNG.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { type Project, projectById, STEADING } from "../projects.ts";
import { THEMES } from "./color.ts";
import { LIGHT_BOX, LIGHTS, markBody } from "./mark.ts";

/** The size every service that shows a link's picture asks for. */
export const CARD = { width: 1200, height: 630 };

const PAD = 72;
/** The width the headline may take, beside the lights. */
const COLUMN = 640;
/** Plex Mono's every letter is 600 units of a 1000-unit em; the headline is set 0.02em tighter. */
const ADVANCE = 0.58;
const SIZES = [76, 68, 60, 52] as const;
const SMALLEST = 46;
const MOST_LINES = 3;

const daylight = THEMES.light;

export interface Word {
  text: string;
  italic: boolean;
}

/** A headline's words, each marked italic where the headline leans on it with `*emphasis*`. */
export function words(headline: string): Word[] {
  return headline.split(/(\*[^*]+\*)/).flatMap((part) => {
    const italic = part.startsWith("*") && part.endsWith("*") && part.length > 2;
    return (italic ? part.slice(1, -1) : part)
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => ({ text, italic }));
  });
}

/** How many lines the words take at a size, wrapped at spaces the way a browser would. */
export function lines(list: readonly Word[], size: number, width = COLUMN): number {
  const fits = Math.floor(width / (size * ADVANCE));
  let count = 1;
  let used = 0;
  for (const { text } of list) {
    const needed = used === 0 ? text.length : used + 1 + text.length;
    if (needed <= fits) used = needed;
    else {
      count += 1;
      used = text.length;
    }
  }
  return count;
}

/** The largest size at which the headline fits in three lines. A longer one takes the smallest size and a fourth line. */
export function headlineSize(list: readonly Word[]): number {
  return SIZES.find((size) => lines(list, size) <= MOST_LINES) ?? SMALLEST;
}

/** A color mixed into the card's surface, as `#RRGGBB`. */
export function tint(hex: string, share: number, base: string = daylight.surface): string {
  const channels = (value: string) => [1, 3, 5].map((at) => Number.parseInt(value.slice(at, at + 2), 16));
  const [from, onto] = [channels(hex), channels(base)];
  return `#${from.map((channel, index) => Math.round(channel * share + (onto[index] ?? 0) * (1 - share)).toString(16).padStart(2, "0")).join("")}`;
}

const asImage = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/**
 * A mark with its colors written on each shape. A `<style>` inside an SVG
 * reaches every SVG in the same picture, so marks of several colors side by
 * side can't each bring their own.
 */
export function colored(body: string, light: string, ring: string = daylight.ink): string {
  return body
    .replaceAll('class="mark-ring"', `fill="${ring}"`)
    .replaceAll('class="mark-fill"', `fill="${light}"`)
    .replaceAll('class="mark-stroke"', `fill="none" stroke="${light}"`);
}

/** A project's courtyard, in the card's ink with the project's light. */
export function courtyard(project: Project): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${colored(markBody(project.glyph), project.color.light)}</svg>`;
}

/** One project's light in a rounded tile of its own color, at (x, y) in a drawing. */
function tile(project: Project, x: number, y: number, size: number): string {
  const color = project.color.light;
  const inset = size * 0.2;
  return [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${tint(color, 0.1)}" stroke="${tint(color, 0.7)}" stroke-width="3.5"/>`,
    `<svg x="${x + inset}" y="${y + inset}" width="${size - 2 * inset}" height="${size - 2 * inset}" viewBox="${LIGHT_BOX}">${colored(LIGHTS[project.glyph], color)}</svg>`,
  ].join("");
}

/** The lights beside the words: on the hub, the plan with the projects around it; on a project's site, its own light. */
export function lights(project: Project): { svg: string; size: number } {
  if (project.id !== STEADING.id) {
    const size = 300;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${size + 8} ${size + 8}" width="${size}" height="${size}">${tile(project, 0, 0, size)}</svg>`, size };
  }
  const size = 400;
  const outer = 100;
  const middle = 84;
  const centre = size / 2;
  const around = [
    { id: "thicket", x: centre - outer / 2, y: 0 },
    { id: "almanac", x: 0, y: centre - outer / 2 },
    { id: "mill", x: size - outer, y: centre - outer / 2 },
    { id: "croft", x: centre - outer / 2, y: size - outer },
  ].map((spot) => ({ ...spot, project: projectById(spot.id) }));
  const dots = around
    .map(({ project, x, y }) => {
      const [fromX, fromY] = [x + outer / 2, y + outer / 2];
      const toward = (from: number, to: number, by: number) => from + Math.sign(to - from) * by;
      const [startX, startY] = [toward(fromX, centre, outer / 2 + 10), toward(fromY, centre, outer / 2 + 10)];
      const [endX, endY] = [toward(centre, fromX, middle / 2 + 10), toward(centre, fromY, middle / 2 + 10)];
      return `<path d="M${startX} ${startY}L${endX} ${endY}" stroke="${project.color.light}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 10"/>`;
    })
    .join("");
  const tiles = around.map(({ project, x, y }) => tile(project, x, y, outer)).join("");
  const plan = tile(projectById("skift"), centre - middle / 2, centre - middle / 2, middle);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${size + 8} ${size + 8}" width="${size}" height="${size}">${dots}${tiles}${plan}</svg>`, size };
}

type Node = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node => ({ type, props: { ...props, style, children } });

/** The card as satori's element tree. */
export function card(site: { project: Project; headline: string; host: string }): Node {
  const list = words(site.headline);
  const size = headlineSize(list);
  const art = lights(site.project);
  // The card is its exact size, and the margin is on the row inside it: satori adds a box's padding to a size given in percent.
  return el("div", { display: "flex", width: CARD.width, height: CARD.height, background: daylight.surface, color: daylight.ink }, [
    el("div", { display: "flex", flexGrow: 1, margin: PAD, justifyContent: "space-between", alignItems: "center" }, [
      el("div", { display: "flex", flexDirection: "column", justifyContent: "space-between", width: COLUMN, alignSelf: "stretch" }, [
        el("div", { display: "flex", alignItems: "center", gap: 24 }, [
          el("img", { width: 72, height: 72 }, undefined, { src: asImage(courtyard(site.project)), width: 72, height: 72 }),
          el("div", { fontFamily: "Plex Mono", fontWeight: 600, fontSize: 52, letterSpacing: -1 }, site.project.name),
        ]),
        el(
          "div",
          { display: "flex", flexWrap: "wrap", columnGap: size * 0.6, fontFamily: "Plex Mono", fontWeight: 600, fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.02 },
          list.map((word) => el("span", { fontStyle: word.italic ? "italic" : "normal" }, word.text)),
        ),
        el("div", { fontFamily: "Plex Sans", fontSize: 38, color: daylight.muted }, site.host),
      ]),
      el("img", { width: art.size, height: art.size, flexShrink: 0 }, undefined, { src: asImage(art.svg), width: art.size, height: art.size }),
    ]),
  ]);
}

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));

/** The card for a site, as a PNG. */
export async function renderCard(site: { project: Project; headline: string; host: string }): Promise<Buffer> {
  const svg = await satori(card(site) as Parameters<typeof satori>[0], {
    ...CARD,
    fonts: [
      { name: "Plex Mono", data: font("ibm-plex-mono", "ibm-plex-mono-latin-600-normal.woff"), weight: 600, style: "normal" },
      { name: "Plex Mono", data: font("ibm-plex-mono", "ibm-plex-mono-latin-600-italic.woff"), weight: 600, style: "italic" },
      { name: "Plex Sans", data: font("ibm-plex-sans", "ibm-plex-sans-latin-400-normal.woff"), weight: 400, style: "normal" },
    ],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
