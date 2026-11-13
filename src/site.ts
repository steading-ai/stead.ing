/**
 * Which site this build is. One codebase builds the hub and every project's
 * site; the content folder says which. `STEADING_CONTENT` points at that
 * folder, and its `site.yaml` names the project. For the hub that folder is
 * this repository's `content/`; for a project it is the project's repository.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { type DocsSettings, folders, type Layout, mountOf, NO_SETTINGS, scanPages } from "./lib/pages.ts";
import { type Project, projectById, STEADING } from "./projects.ts";

const contentDir = resolve(process.env.STEADING_CONTENT ?? "content");

/** What this file needs from site.yaml before Astro has loaded anything: the project, and how its docs are arranged. */
function readSite(): { id: string; docs: DocsSettings } {
  const file = resolve(contentDir, "site.yaml");
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    throw new Error(`${file} is missing. A site's content folder starts with a site.yaml naming its project.`);
  }
  const yaml = (parseYaml(raw) ?? {}) as { project?: unknown; docs?: Partial<DocsSettings> };
  if (typeof yaml.project !== "string") throw new Error(`${file}: "project" must name a Steading project.`);
  return { id: yaml.project, docs: { ...NO_SETTINGS, ...yaml.docs } };
}

const read = readSite();
const project: Project = projectById(read.id);
const isHub = project.id === STEADING.id;
const origin = isHub ? "https://stead.ing" : `https://${project.id}.stead.ing`;
const layout: Layout = isHub ? "hub" : "project";
const pages = scanPages(contentDir, layout, read.docs);

export const SITE = {
  project,
  isHub,
  origin,
  title: project.name,
  language: "en",
  contentDir,
  layout,
  /** Where the pages begin: the top of the hub, and `/docs/` on a project's site. */
  mount: mountOf(layout),
  /** The Markdown files that are this site's pages. A site may start with only its front page. */
  pages,
  /** Folders that hold pages, each with the address of its own page. */
  folders: folders(pages, layout),
  docs: read.docs,
  /** Names this content folder, so builds of different sites never share a cache. */
  cacheKey: `${project.id}-${createHash("sha256").update(contentDir).digest("hex").slice(0, 8)}`,
  /** Where the build lands. Each site gets its own folder so several can be built side by side. */
  outDir: resolve(process.env.STEADING_OUT ?? `dist/${project.id}`),
  /**
   * Web address of the content folder, for "edit this page" links. The site
   * action sets it from the repository it runs in.
   */
  editBase:
    process.env.STEADING_EDIT_BASE ??
    (isHub ? "https://github.com/steading-ai/stead.ing/edit/main/content" : project.repo ? `${project.repo}/edit/main` : undefined),
  /**
   * Where a project's other files can be read on the web, for links from its
   * docs to its source: a file under `blob`, a folder under `tree`.
   */
  source: !isHub && project.repo ? { blob: `${project.repo}/blob/main`, tree: `${project.repo}/tree/main` } : undefined,
  hub: "https://stead.ing/",
  /** Where the people building Steading talk. */
  chat: "https://discord.gg/BjCu2vHgX4",
  license: { name: "ISC", url: "https://opensource.org/license/isc-license-txt" },
} as const;

export const absolute = (path: string) => new URL(path, SITE.origin).href;

/**
 * Pages on the hub that every site's footer links to. A project's site cannot
 * see the hub's content, so they are named here, and a test over the built hub
 * fails if one stops existing.
 */
export const HUB_PAGES = [
  { path: "/open-for-good/", label: "Open for good" },
  { path: "/how-we-work/", label: "How we work" },
] as const;

export const MEDIA_TYPES = {
  markdown: "text/markdown; charset=utf-8",
  text: "text/plain; charset=utf-8",
  xml: "application/xml",
} as const;
