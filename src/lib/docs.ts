/**
 * A site's pages, independent of Astro: what each is called, how the
 * navigation arranges them, and what their Markdown twins say. Pure
 * functions, so tests need no build.
 */
import { stringify as toYaml } from "yaml";
import { leadingTitle, markdownPath } from "./markdown.ts";
import { type DocsSettings, type Layout, NO_SETTINGS, type PageSource, pathOf } from "./pages.ts";

export interface DocInput extends PageSource {
  data: { title?: string | undefined; description?: string | undefined; order?: number | undefined };
  body: string;
}

export interface Doc extends DocInput {
  /** Address of the Markdown twin: `/docs/guide/first.md`. */
  markdown: string;
  title: string;
  /** What the navigation calls the page: its title, except for the first page, which is the overview. */
  label: string;
  /** Whether the body opens with its own `# Title`, so the layout must not add one. */
  hasHeading: boolean;
  /** Set for a folder's page that no file wrote: it lists the folder's pages. */
  lists?: Doc[];
}

const humanize = (slug: string) => slug.replace(/[-_]+/g, " ").replace(/^./, (first) => first.toUpperCase());

/** Folder names that mean something more than they say. */
const KNOWN_GROUPS: Record<string, string> = { adr: "Decisions", adrs: "Decisions" };

export function toDoc(input: DocInput): Doc {
  const heading = leadingTitle(input.body);
  const fallback = humanize(input.route.split("/").at(-1) || "Overview");
  return {
    ...input,
    markdown: markdownPath(input.path),
    title: input.data.title ?? heading ?? fallback,
    label: input.route === "" ? "Overview" : (input.data.title ?? heading ?? fallback),
    hasHeading: heading !== undefined,
  };
}

export interface NavGroup {
  /** Undefined for pages at the top. */
  label: string | undefined;
  /** The folder's own page, which its label links to. */
  index: Doc | undefined;
  docs: Doc[];
}

const position = (order: readonly string[], doc: Doc) => {
  const listed = order.indexOf(doc.route);
  return listed === -1 ? (doc.data.order ?? Number.POSITIVE_INFINITY) + order.length : listed;
};

/**
 * Pages arranged for reading. The first page leads, then the top-level pages
 * in the order the site asks for (and by title after that), then each folder:
 * under its own name, in file order, since folders of records are numbered or
 * dated on purpose. A folder with no page of its own gets one that lists it.
 */
export function navigation(docs: readonly Doc[], layout: Layout, settings: DocsSettings = NO_SETTINGS): NavGroup[] {
  const top = docs
    .filter((doc) => doc.group === "")
    .sort((a, b) => Number(b.route === "") - Number(a.route === "") || position(settings.order, a) - position(settings.order, b) || a.title.localeCompare(b.title));
  const names = [...new Set(docs.map((doc) => doc.group).filter((group) => group !== ""))].sort();
  const groups = names.map((name) => {
    const members = docs.filter((doc) => doc.group === name && !doc.index).sort((a, b) => a.route.localeCompare(b.route));
    const own = docs.find((doc) => doc.group === name && doc.index);
    const label = settings.groups[name] ?? KNOWN_GROUPS[name] ?? own?.title ?? humanize(name);
    const index =
      own ??
      ({
        file: "",
        route: name,
        path: pathOf(layout, name),
        group: name,
        index: true,
        data: {},
        body: "",
        markdown: markdownPath(pathOf(layout, name)),
        title: label,
        label,
        hasHeading: false,
        lists: members,
      } satisfies Doc);
    return { label, index, docs: members };
  });
  return [...(top.length > 0 ? [{ label: undefined, index: undefined, docs: top }] : []), ...groups];
}

/** Every page in reading order, each folder's own page ahead of the folder's pages. */
export const ordered = (nav: readonly NavGroup[]): Doc[] => nav.flatMap((group) => [...(group.index ? [group.index] : []), ...group.docs]);

/** A page's Markdown twin: frontmatter an agent can cite from, then the page. */
export function docMarkdown(doc: Doc, site: { origin: string; title: string }): string {
  const at = (path: string) => new URL(path, site.origin).href;
  const frontmatter = toYaml({
    title: doc.title,
    canonical: at(doc.path),
    ...(doc.data.description ? { summary: doc.data.description } : {}),
    site: site.title,
  });
  const written = doc.lists ? doc.lists.map((page) => `- [${page.title}](${at(page.markdown)})`).join("\n") : doc.body.trimStart();
  const body = doc.hasHeading ? written : `# ${doc.title}\n\n${written}`;
  return `---\n${frontmatter}---\n\n${body.trimEnd()}\n`;
}
