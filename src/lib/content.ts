/** The site's content as Astro loaded it, in the shapes the pages and endpoints use. */
import { relative, resolve } from "node:path";
import { type CollectionEntry, getCollection } from "astro:content";
import { PROJECTS } from "../projects.ts";
import { SITE } from "../site.ts";
import type { SiteInfo } from "./discovery.ts";
import { type Doc, type NavSection, navigation, ordered, toDoc } from "./docs.ts";
import { promptFor } from "./prompt.ts";
import type { Landing } from "./schema.ts";

/** A page with what Astro needs to render it. A folder's generated page has no entry: it only lists. */
export type LoadedDoc = Doc & { entry?: CollectionEntry<"docs"> };

/** site.yaml, with the prompt filled in from the template when the site does not write its own. */
export async function getLanding(): Promise<Landing & { prompt: string }> {
  const [entry] = await getCollection("landing");
  if (!entry) throw new Error(`${SITE.contentDir}/site.yaml did not load.`);
  return { ...entry.data, prompt: entry.data.prompt ?? promptFor({ origin: SITE.origin, name: SITE.project.name, isHub: SITE.isHub }) };
}

const fileOf = (entry: CollectionEntry<"docs">) => {
  if (!entry.filePath) throw new Error(`Page "${entry.id}" has no file behind it.`);
  return relative(SITE.contentDir, resolve(entry.filePath)).replace(/\\/g, "/");
};

/** The pages arranged for reading, and the same pages as one list in that order. */
export async function getPages(): Promise<{ nav: NavSection[]; docs: LoadedDoc[] }> {
  // Astro warns on every read of an empty collection, and a site with no pages yet is fine.
  if (SITE.pages.length === 0) return { nav: [], docs: [] };
  const sources = new Map(SITE.pages.map((page) => [page.file, page]));
  const loaded = (await getCollection("docs")).map((entry) => {
    const source = sources.get(fileOf(entry));
    if (!source) throw new Error(`${fileOf(entry)} was loaded but is not one of this site's pages.`);
    return { ...toDoc({ ...source, data: entry.data, body: entry.body ?? "" }), entry };
  });
  const nav = navigation(loaded, SITE.layout, SITE.docs);
  return { nav, docs: ordered(nav) };
}

/** Every page a person wrote, in reading order: what llms.txt and the sitemap list. */
export const getDocs = async (): Promise<LoadedDoc[]> => (await getPages()).docs.filter((doc) => !doc.lists);

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
