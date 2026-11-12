/**
 * A site's pages, independent of Astro: where each lives, what it is called,
 * and how the navigation orders them. Pure functions, so tests need no build.
 */
import { stringify as toYaml } from "yaml";
import { leadingTitle, markdownPath, pagePath } from "./markdown.ts";

export interface DocInput {
  /** Path inside the content folder, with its extension: `guide/first.md`. */
  file: string;
  data: { title?: string | undefined; description?: string | undefined; order?: number | undefined };
  body: string;
}

export interface Doc extends DocInput {
  /** Page address: `/guide/first/`. */
  path: string;
  /** Address of the Markdown twin: `/guide/first.md`. */
  markdown: string;
  title: string;
  /** Whether the body opens with its own `# Title`, so the layout must not add one. */
  hasHeading: boolean;
}

const humanize = (slug: string) => slug.replace(/[-_]+/g, " ").replace(/^./, (first) => first.toUpperCase());

export function toDoc(input: DocInput): Doc {
  const path = pagePath(input.file);
  const heading = leadingTitle(input.body);
  const fallback = humanize(path.split("/").filter(Boolean).at(-1) ?? "Home");
  return {
    ...input,
    path,
    markdown: markdownPath(path),
    title: input.data.title ?? heading ?? fallback,
    hasHeading: heading !== undefined,
  };
}

const byOrder = (a: Doc, b: Doc) =>
  (a.data.order ?? Number.POSITIVE_INFINITY) - (b.data.order ?? Number.POSITIVE_INFINITY) || a.title.localeCompare(b.title);

export interface NavGroup {
  /** Undefined for pages at the top of the content folder. */
  label: string | undefined;
  docs: Doc[];
}

/**
 * Pages grouped by their top-level folder: the top-level pages first, then each
 * folder under its index page's title (or its own name).
 */
export function navigation(docs: readonly Doc[]): NavGroup[] {
  const groups = new Map<string, Doc[]>();
  for (const doc of docs) {
    const segments = doc.file.split("/");
    const folder = segments.length > 1 ? (segments[0] as string) : "";
    groups.set(folder, [...(groups.get(folder) ?? []), doc]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, members]) => {
      const index = members.find((doc) => doc.file === `${folder}/index.md`);
      return {
        label: folder === "" ? undefined : (index?.title ?? humanize(folder)),
        docs: [...members].sort((a, b) => (a === index ? -1 : b === index ? 1 : byOrder(a, b))),
      };
    });
}

/** Every page in navigation order. */
export const ordered = (docs: readonly Doc[]): Doc[] => navigation(docs).flatMap((group) => group.docs);

/** A page's Markdown twin: frontmatter an agent can cite from, then the page. */
export function docMarkdown(doc: Doc, site: { origin: string; title: string }): string {
  const frontmatter = toYaml({
    title: doc.title,
    canonical: new URL(doc.path, site.origin).href,
    ...(doc.data.description ? { summary: doc.data.description } : {}),
    site: site.title,
  });
  const body = doc.hasHeading ? doc.body.trimStart() : `# ${doc.title}\n\n${doc.body.trimStart()}`;
  return `---\n${frontmatter}---\n\n${body.trimEnd()}\n`;
}
