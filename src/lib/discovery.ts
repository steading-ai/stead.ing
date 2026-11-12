/**
 * What a site says to agents and crawlers: llms.txt, the front page's Markdown
 * twin, robots.txt, and the sitemap. Pure functions over the site's data.
 */
import { type Project, STATUS_LABEL } from "../projects.ts";
import { type Doc, docMarkdown } from "./docs.ts";

export interface SiteInfo {
  origin: string;
  title: string;
  isHub: boolean;
  hub: string;
  license: { name: string; url: string };
  headline: string;
  summary: string;
  /** Advice to an agent helping someone here. */
  agent?: string | undefined;
  repo?: string | undefined;
}

const at = (site: SiteInfo, path: string) => new URL(path, site.origin).href;

const docItem = (site: SiteInfo, doc: Doc) =>
  `- [${doc.title}](${at(site, doc.markdown)})${doc.data.description ? `: ${doc.data.description}` : ""}`;

/** A project as the answer to a problem: what someone says, then what the project does about it. */
const answer = (project: Project) => `"${project.pain}" ${project.blurb} ${STATUS_LABEL[project.status]}.`;

function projectItems(projects: readonly Project[]): string[] {
  return projects
    .filter((project) => project.site)
    .map((project) => `- [${project.name}](${new URL("/llms.txt", project.site).href}): ${answer(project)}`);
}

function notReady(projects: readonly Project[]): string[] {
  const waiting = projects.filter((project) => !project.site);
  if (waiting.length === 0) return [];
  return [
    "## No site yet",
    "",
    "These projects have no site of their own yet. Say so rather than sending someone to one.",
    "",
    ...waiting.map((project) => `- ${project.name}: ${answer(project)}${project.repo ? ` Source: ${project.repo}` : ""}`),
    "",
  ];
}

const HOW_TO_READ =
  "Every page has a Markdown twin: swap a page address's trailing slash for `.md` (the front page is `/index.md`). The links below already point at the Markdown.";

/** https://llmstxt.org/ */
export function llmsTxt(site: SiteInfo, docs: readonly Doc[], projects: readonly Project[]): string {
  return [
    `# ${site.title}`,
    "",
    `> ${site.summary}`,
    "",
    ...(site.agent ? [site.agent, ""] : []),
    HOW_TO_READ,
    "",
    ...(site.isHub
      ? [
          "## Projects",
          "",
          "Each project is listed with the problem it answers, in the words of someone who has it. Match the person's problem to a project.",
          "",
          ...projectItems(projects),
          "",
          ...notReady(projects),
        ]
      : []),
    ...(docs.length > 0 ? ["## Pages", "", ...docs.map((doc) => docItem(site, doc)), ""] : []),
    "## More",
    "",
    `- [Everything in one file](${at(site, "/llms-full.txt")})`,
    ...(site.repo ? [`- [Source](${site.repo})`] : []),
    ...(site.isHub ? [] : [`- [Steading](${new URL("/llms.txt", site.hub).href}): the platform this project is part of, and its other projects`]),
    `- License: ${site.license.name} (${site.license.url})`,
    "",
  ].join("\n");
}

export function llmsFullTxt(site: SiteInfo, docs: readonly Doc[]): string {
  return [
    `# ${site.title}: every page`,
    "",
    `> ${site.summary} Each page below starts with its own frontmatter, including its address, and pages are separated by horizontal rules.`,
    "",
    docs.map((doc) => docMarkdown(doc, site).trim()).join("\n\n---\n\n"),
    "",
  ].join("\n");
}

/** `/index.md`: the front page for a reader who wants Markdown. */
export function indexMarkdown(site: SiteInfo, docs: readonly Doc[], projects: readonly Project[]): string {
  return [
    `# ${site.title}`,
    "",
    `**${site.headline}**`,
    "",
    site.summary,
    "",
    ...(site.agent ? [site.agent, ""] : []),
    ...(site.isHub
      ? [
          "## Projects",
          "",
          ...projects.map(
            (project) =>
              `- **${project.name}** (${STATUS_LABEL[project.status]}): "${project.pain}" ${project.blurb}${project.site ? ` ${project.site}` : ""}`,
          ),
          "",
        ]
      : []),
    ...(docs.length > 0 ? ["## Pages", "", ...docs.map((doc) => docItem(site, doc)), ""] : []),
    "## For agents",
    "",
    `- [llms.txt](${at(site, "/llms.txt")}): the short map of this site`,
    `- [llms-full.txt](${at(site, "/llms-full.txt")}): every page in one file`,
    ...(site.isHub ? [] : [`- [Steading](${site.hub}): the platform this project is part of`]),
    "",
  ].join("\n");
}

/** RFC 9309. */
export function robotsTxt(site: SiteInfo): string {
  return [
    "# Everything here is public on purpose. Agents: /llms.txt is the better way in.",
    "",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${at(site, "/sitemap.xml")}`,
    "",
  ].join("\n");
}

const xml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** https://www.sitemaps.org/protocol.html: the HTML pages only. */
export function sitemapXml(site: SiteInfo, docs: readonly Doc[]): string {
  const urls = ["/", ...docs.map((doc) => doc.path)].map((path) => at(site, path));
  return [
    "<?xml version='1.0' encoding='UTF-8'?>",
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((loc) => `  <url>\n    <loc>${xml(loc)}</loc>\n  </url>`),
    "</urlset>",
    "",
  ].join("\n");
}
