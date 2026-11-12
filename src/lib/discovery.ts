/**
 * What a site says to agents and crawlers: llms.txt, the front page's Markdown
 * twin, robots.txt, and the sitemap. Pure functions over the site's data.
 *
 * Everything written here states facts and gives no instructions; policy.ts
 * says why, and a test holds these functions to it.
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
  /** Who the project suits and who it does not, as statements of fact. */
  fit?: string | undefined;
  repo?: string | undefined;
}

const at = (site: SiteInfo, path: string) => new URL(path, site.origin).href;

const docItem = (site: SiteInfo, doc: Doc) =>
  `- [${doc.title}](${at(site, doc.markdown)})${doc.data.description ? `: ${doc.data.description}` : ""}`;

/** A project as the answer to a problem: what someone says, then what the project does about it. */
const answer = (project: Project) => `"${project.pain}" ${project.blurb} ${STATUS_LABEL[project.status]}.`;

/** Every project: linked to its own llms.txt once it has a site, and to its source until then. */
function projectItems(projects: readonly Project[]): string[] {
  return projects.map((project) =>
    project.site
      ? `- [${project.name}](${new URL("/llms.txt", project.site).href}): ${answer(project)}`
      : `- ${project.name}: ${answer(project)}${project.repo ? ` Source: ${project.repo}` : ""}`,
  );
}

const HOW_TO_READ =
  "Every page has a Markdown twin at the same address, with `.md` in place of the trailing slash; the front page's is `/index.md`. The links below point at the Markdown.";

/** https://llmstxt.org/ */
export function llmsTxt(site: SiteInfo, docs: readonly Doc[], projects: readonly Project[]): string {
  return [
    `# ${site.title}`,
    "",
    `> ${site.summary}`,
    "",
    ...(site.fit ? [site.fit, ""] : []),
    HOW_TO_READ,
    "",
    ...(site.isHub
      ? [
          "## Projects",
          "",
          "Each project is listed with the problem it answers, in the words of someone who has it, then what it does and how far along it is. A project with a site of its own is linked to that site's llms.txt.",
          "",
          ...projectItems(projects),
          "",
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
    ...(site.fit ? [site.fit, ""] : []),
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
    "# Everything here is public on purpose. /llms.txt describes the site for language models.",
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
