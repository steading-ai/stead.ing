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

/** A line of the navigation: a page, or a folder with its pages under it. */
export interface NavItem {
  /** The page the line leads to. For a folder, the folder's own page. */
  doc: Doc;
  /** What the navigation calls it. */
  label: string;
  /** The number or date a record's file name opens with, shown ahead of its name: `011`. */
  mark?: string;
  /** A folder's pages, which the navigation shows only while the reader is in the folder. */
  pages?: NavItem[];
}

export interface NavSection {
  /** Undefined for the lines that lead the navigation. */
  title: string | undefined;
  /** Folded away until the reader opens it, or is on one of its pages. */
  collapsed: boolean;
  items: NavItem[];
}

const position = (order: readonly string[], doc: Doc) => {
  const listed = order.indexOf(doc.route);
  return listed === -1 ? (doc.data.order ?? Number.POSITIVE_INFINITY) + order.length : listed;
};

/** What a record's file name opens with, unless its title already says it: `011-first.md` is `011`. */
function markOf(doc: Doc): string | undefined {
  const mark = /^(\d{4}-\d{2}(?:-\d{2})?|\d+)[-_]/.exec(doc.route.split("/").at(-1) ?? "")?.[1];
  return mark && !new RegExp(`^\\W*(adr\\W*)?${mark}\\b`, "i").test(doc.title) ? mark : undefined;
}

const line = (doc: Doc): NavItem => ({ doc, label: doc.label });

/**
 * Pages arranged for reading. The first page leads. A folder is one line, its
 * own page, with its pages beneath in file order, since folders of records are
 * numbered or dated on purpose; a folder with no page of its own gets one that
 * lists it.
 *
 * A site that names sections gets them in the order it gives, each holding the
 * pages and folders it lists, and whatever no section lists follows in a
 * section called "More". Without sections there is one list: the top-level
 * pages in the order the site asks for (and by title after that), then the
 * folders.
 */
export function navigation(docs: readonly Doc[], layout: Layout, settings: DocsSettings = NO_SETTINGS): NavSection[] {
  const top = docs
    .filter((doc) => doc.group === "")
    .sort((a, b) => Number(b.route === "") - Number(a.route === "") || position(settings.order, a) - position(settings.order, b) || a.title.localeCompare(b.title));
  const names = [...new Set(docs.map((doc) => doc.group).filter((group) => group !== ""))].sort();
  const folders = names.map((name): NavItem => {
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
    return {
      doc: index,
      label,
      pages: members.map((doc) => {
        const mark = markOf(doc);
        return { ...line(doc), ...(mark ? { mark } : {}) };
      }),
    };
  });

  if (settings.sections.length === 0) {
    const items = [...top.map(line), ...folders];
    return items.length > 0 ? [{ title: undefined, collapsed: false, items }] : [];
  }

  // What a section may list, by the name it is listed under: a page's route, or a folder's name and a slash.
  const unlisted = new Map<string, NavItem>([
    ...top.filter((doc) => doc.route !== "").map((doc) => [doc.route, line(doc)] as const),
    ...folders.map((folder) => [`${folder.doc.route}/`, folder] as const),
  ]);
  const listed = new Set<string>();
  const sections = settings.sections.map((section): NavSection => {
    const items = section.pages.map((entry) => {
      const [name, label] = typeof entry === "string" ? [entry, undefined] : (Object.entries(entry)[0] ?? ["", undefined]);
      const item = unlisted.get(name);
      if (!item) {
        throw new Error(
          listed.has(name)
            ? `docs.sections lists "${name}" twice. A page belongs to one section.`
            : `docs.sections: "${section.title}" lists "${name}", which is not a page. Name a top-level page by its file's name without ".md", or a folder with a slash after it.`,
        );
      }
      unlisted.delete(name);
      listed.add(name);
      return label ? { ...item, label } : item;
    });
    return { title: section.title, collapsed: section.collapsed ?? false, items };
  });
  const overview = top.filter((doc) => doc.route === "").map(line);
  return [
    ...(overview.length > 0 ? [{ title: undefined, collapsed: false, items: overview }] : []),
    ...sections,
    ...(unlisted.size > 0 ? [{ title: "More", collapsed: false, items: [...unlisted.values()] }] : []),
  ];
}

/** Every page in reading order, each folder's own page ahead of the folder's pages. */
export const ordered = (nav: readonly NavSection[]): Doc[] =>
  nav.flatMap((section) => section.items.flatMap((item) => [item.doc, ...(item.pages ?? []).map((page) => page.doc)]));

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
