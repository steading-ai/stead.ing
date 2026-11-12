/**
 * Which site this build is. One codebase builds the hub and every project's
 * site; the content folder says which. `STEADING_CONTENT` points at that folder
 * (default: this repository's `content/`, the hub), and its `site.yaml` names
 * the project.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { type Project, projectById, STEADING } from "./projects.ts";

const contentDir = resolve(process.env.STEADING_CONTENT ?? "content");

function readProjectId(): string {
  const file = resolve(contentDir, "site.yaml");
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    throw new Error(`${file} is missing. A site's content folder starts with a site.yaml naming its project.`);
  }
  const id = (parseYaml(raw) as { project?: unknown } | null)?.project;
  if (typeof id !== "string") throw new Error(`${file}: "project" must name a Steading project.`);
  return id;
}

const project: Project = projectById(readProjectId());
const isHub = project.id === STEADING.id;
const origin = isHub ? "https://stead.ing" : `https://${project.id}.stead.ing`;

export const SITE = {
  project,
  isHub,
  origin,
  title: project.name,
  language: "en",
  contentDir,
  /** Whether the content folder has any pages yet. A site may start with only its front page. */
  hasPages: readdirSync(contentDir, { recursive: true }).some((name) => String(name).endsWith(".md")),
  /** Names this content folder, so builds of different sites never share a cache. */
  cacheKey: `${project.id}-${createHash("sha256").update(contentDir).digest("hex").slice(0, 8)}`,
  /** Where the build lands. Each site gets its own folder so several can be built side by side. */
  outDir: resolve(process.env.STEADING_OUT ?? `dist/${project.id}`),
  /**
   * Web address of the content folder, for "edit this page" links. The site
   * action sets it from the repository it runs in.
   */
  editBase: process.env.STEADING_EDIT_BASE ?? (isHub ? "https://github.com/steading-ai/stead.ing/edit/main/content" : undefined),
  hub: "https://stead.ing/",
  /** Where the people building Steading talk. */
  chat: "https://discord.gg/7A7Pb7N92",
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
