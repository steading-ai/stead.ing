/**
 * Which Markdown files make up a site's pages, and where each one lives.
 *
 * The hub keeps its pages in a content folder, and each sits at the top of
 * the site: `content/how-we-work.md` is `/how-we-work/`.
 *
 * A project's site is built from the project's own repository, so nothing has
 * to be written twice: its README is `/docs/`, and every Markdown file under
 * its `docs/` folder is a page beneath that, in the same shape as the folder.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type Layout = "hub" | "project";

export interface PageSource {
  /** Path from the content folder, with forward slashes: `docs/adrs/001-first.md`. */
  file: string;
  /** Where the page sits beneath the mount, without slashes at the ends: `adrs/001-first`. Empty for the first page. */
  route: string;
  /** The page's address: `/docs/adrs/001-first/`. */
  path: string;
  /** The folder the page is filed under, or empty if it sits at the top: `adrs`. */
  group: string;
  /** Whether the page is its folder's own page (an `index.md` or `README.md`). */
  index: boolean;
}

/** A named part of the navigation: the pages a reader with one kind of need looks through. */
export interface SectionSetting {
  title: string;
  /**
   * Top-level pages by route and folders by name with a slash after it, in
   * reading order: `[install, adrs/]`. An entry written `install: Install`
   * gives the page a shorter name in the navigation.
   */
  pages: (string | Record<string, string>)[];
  /** Folded away until the reader opens it, or is on one of its pages. */
  collapsed?: boolean | undefined;
}

export interface DocsSettings {
  /** Top-level pages in the order they should be read, by route: `[vision, core-principles]`. The rest follow by title. Sections, where a site names them, take its place. */
  order: string[];
  /** Files, or folders ending in a slash, to leave out: `[docs/adrs/000-adr-template.md, docs/plans/]`. */
  exclude: string[];
  /** Names for folders, where the folder's own name will not do: `{ adrs: Decisions }`. */
  groups: Record<string, string>;
  /** The navigation in named sections, in order. What no section lists follows in one called "More". */
  sections: SectionSetting[];
}

export const NO_SETTINGS: DocsSettings = { order: [], exclude: [], groups: {}, sections: [] };

/** Where a layout's pages are mounted. */
export const mountOf = (layout: Layout) => (layout === "hub" ? "/" : "/docs/");

export const pathOf = (layout: Layout, route: string) => (route === "" ? mountOf(layout) : `${mountOf(layout)}${route}/`);

function markdownUnder(root: string, dir: string): string[] {
  const here = join(root, dir);
  if (!existsSync(here)) return [];
  return readdirSync(here, { withFileTypes: true })
    .flatMap((entry) => {
      const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) return entry.name.startsWith(".") || entry.name === "node_modules" ? [] : markdownUnder(root, path);
      return entry.name.endsWith(".md") ? [path] : [];
    })
    .sort();
}

const IMAGE = /\.(svg|png|jpe?g|gif|webp|avif)$/i;

function imagesUnder(root: string, dir: string): string[] {
  const here = join(root, dir);
  if (!existsSync(here)) return [];
  return readdirSync(here, { withFileTypes: true }).flatMap((entry) => {
    const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) return entry.name.startsWith(".") || entry.name === "node_modules" ? [] : imagesUnder(root, path);
    return IMAGE.test(entry.name) ? [path] : [];
  });
}

/**
 * The pictures a site's pages may show, each with the address it is served
 * at: the images kept beside the pages, in the same shape as their folder.
 * `docs/assets/banner.svg` in a project is `/docs/assets/banner.svg`.
 */
export function scanImages(root: string, layout: Layout): Map<string, string> {
  const files = imagesUnder(root, layout === "hub" ? "" : "docs");
  return new Map(files.map((file) => [file, `/${file}`]));
}

const excluded = (file: string, exclude: readonly string[]) =>
  exclude.some((rule) => (rule.endsWith("/") ? file.startsWith(rule) : file === rule));

/** The pages a content folder holds. */
export function scanPages(root: string, layout: Layout, settings: DocsSettings = NO_SETTINGS): PageSource[] {
  const files =
    layout === "hub" ? markdownUnder(root, "") : [...(existsSync(join(root, "README.md")) ? ["README.md"] : []), ...markdownUnder(root, "docs")];
  const pages = files
    .filter((file) => !excluded(file, settings.exclude))
    .map((file) => {
      const within = layout === "project" && file !== "README.md" ? file.slice("docs/".length) : file;
      const route = within.replace(/\.md$/, "").replace(/(^|\/)(index|README)$/, "");
      // A folder's own page. The first page of all is not one: it belongs to no folder.
      const index = route !== "" && /(^|\/)(index|README)\.md$/.test(within);
      const group = index ? route : route.includes("/") ? route.slice(0, route.indexOf("/")) : "";
      return { file, route, path: pathOf(layout, route), group, index };
    });
  const seen = new Map<string, string>();
  for (const page of pages) {
    const other = seen.get(page.path);
    if (other) throw new Error(`${other} and ${page.file} would both be the page at ${page.path}. Rename or exclude one.`);
    seen.set(page.path, page.file);
    if (layout === "hub" && page.route === "") {
      throw new Error(`${page.file} would replace the front page, which site.yaml writes. Rename it.`);
    }
  }
  return pages;
}

/** Every folder that holds pages, with the address of its own page (which is generated when the folder has none). */
export function folders(pages: readonly PageSource[], layout: Layout): Map<string, string> {
  const found = new Map<string, string>();
  const prefix = layout === "project" ? "docs/" : "";
  if (layout === "project") found.set("docs", mountOf(layout));
  for (const page of pages) {
    if (page.group !== "") found.set(`${prefix}${page.group}`, pathOf(layout, page.group));
  }
  return found;
}
