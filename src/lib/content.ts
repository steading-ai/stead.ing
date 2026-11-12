/** The site's content as Astro loaded it, in the shapes the pages and endpoints use. */
import { relative, resolve } from "node:path";
import { type CollectionEntry, getCollection } from "astro:content";
import { PROJECTS } from "../projects.ts";
import { SITE } from "../site.ts";
import type { SiteInfo } from "./discovery.ts";
import { type Doc, ordered, toDoc } from "./docs.ts";
import type { Landing } from "./schema.ts";

export interface LoadedDoc extends Doc {
  entry: CollectionEntry<"docs">;
}

export async function getLanding(): Promise<Landing> {
  const [entry] = await getCollection("landing");
  if (!entry) throw new Error(`${SITE.contentDir}/site.yaml did not load.`);
  return entry.data;
}

function fileOf(entry: CollectionEntry<"docs">): string {
  if (!entry.filePath) throw new Error(`Page "${entry.id}" has no file behind it.`);
  return relative(SITE.contentDir, resolve(entry.filePath)).replace(/\\/g, "/");
}

/** Every page, in navigation order. */
export async function getDocs(): Promise<LoadedDoc[]> {
  // Astro warns on every read of an empty collection, and a site with no pages yet is fine.
  if (!SITE.hasPages) return [];
  const entries = await getCollection("docs");
  const docs = entries.map((entry) => {
    const file = fileOf(entry);
    if (file === "index.md") {
      throw new Error(`${SITE.contentDir}/index.md would replace the front page, which site.yaml writes. Rename it.`);
    }
    return { ...toDoc({ file, data: entry.data, body: entry.body ?? "" }), entry };
  });
  const byPath = new Map(docs.map((doc) => [doc.path, doc]));
  return ordered(docs).map((doc) => byPath.get(doc.path) as LoadedDoc);
}

export async function getSiteInfo(): Promise<SiteInfo> {
  const landing = await getLanding();
  return {
    origin: SITE.origin,
    title: SITE.title,
    isHub: SITE.isHub,
    hub: SITE.hub,
    license: SITE.license,
    headline: landing.headline,
    summary: landing.summary,
    fit: landing.fit,
    repo: SITE.project.repo,
  };
}

export { PROJECTS };
