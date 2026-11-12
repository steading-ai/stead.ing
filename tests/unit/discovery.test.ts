import { describe, expect, it } from "vitest";
import { indexMarkdown, llmsFullTxt, llmsTxt, robotsTxt, type SiteInfo, sitemapXml } from "../../src/lib/discovery.ts";
import { toDoc } from "../../src/lib/docs.ts";
import { PROJECTS } from "../../src/projects.ts";

const LICENSE = { name: "ISC", url: "https://opensource.org/license/isc-license-txt" };

const hub: SiteInfo = {
  origin: "https://stead.ing",
  title: "steading",
  isHub: true,
  hub: "https://stead.ing/",
  license: LICENSE,
  headline: "One person. A thousand agents.",
  summary: "Projects for running agents.",
  fit: "Suits engineers who already run coding agents.",
  repo: "https://github.com/steading-ai/stead.ing",
};

const skift: SiteInfo = { ...hub, origin: "https://skift.stead.ing", title: "skift", isHub: false, fit: undefined };

const docs = [
  toDoc({ file: "start.md", body: "# Start\n\nBegin here.", data: { description: "The first five minutes." } }),
  toDoc({ file: "guide/first.md", body: "# First", data: {} }),
];

describe("llms.txt", () => {
  it("follows the llmstxt.org shape: a title, a quoted summary, then linked sections", () => {
    const lines = llmsTxt(skift, docs, PROJECTS).split("\n");
    expect(lines[0]).toBe("# skift");
    expect(lines[2]).toBe("> Projects for running agents.");
    expect(lines).toContain("## Pages");
    expect(lines).toContain("- [Start](https://skift.stead.ing/start.md): The first five minutes.");
    expect(lines).toContain("- [First](https://skift.stead.ing/guide/first.md)");
  });

  it("on the hub, links only the projects that have a site", () => {
    const text = llmsTxt(hub, docs, PROJECTS);
    for (const project of PROJECTS) {
      const linked = text.includes(`- [${project.name}](`);
      expect(linked, project.name).toBe(project.site !== undefined);
    }
    expect(text).toContain("## No site yet");
  });

  it("on the hub, gives every project the problem it answers", () => {
    const text = llmsTxt(hub, docs, PROJECTS);
    for (const project of PROJECTS) expect(text, project.name).toContain(`"${project.pain}"`);
  });

  it("on a project's site, points back to the hub and lists no other projects", () => {
    const text = llmsTxt(skift, docs, PROJECTS);
    expect(text).toContain("- [Steading](https://stead.ing/llms.txt)");
    expect(text).not.toContain("## Projects");
  });

  it("leaves out the pages section when there are no pages", () => {
    expect(llmsTxt(skift, [], PROJECTS)).not.toContain("## Pages");
  });
});

describe("llms-full.txt", () => {
  it("carries every page, each with its own address", () => {
    const text = llmsFullTxt(skift, docs);
    expect(text).toContain("canonical: https://skift.stead.ing/start/");
    expect(text).toContain("canonical: https://skift.stead.ing/guide/first/");
    expect(text).toContain("Begin here.");
  });
});

describe("index.md", () => {
  it("lists every project on the hub, with its status", () => {
    const text = indexMarkdown(hub, docs, PROJECTS);
    for (const project of PROJECTS) expect(text).toContain(`**${project.name}**`);
    expect(text).toContain("(In design)");
  });
});

describe("robots.txt and the sitemap", () => {
  it("allow everything and name each other", () => {
    expect(robotsTxt(skift)).toContain("Allow: /");
    expect(robotsTxt(skift)).toContain("Sitemap: https://skift.stead.ing/sitemap.xml");
  });

  it("lists the HTML pages, not their twins", () => {
    const xml = sitemapXml(skift, docs);
    expect(xml).toContain("<loc>https://skift.stead.ing/</loc>");
    expect(xml).toContain("<loc>https://skift.stead.ing/guide/first/</loc>");
    expect(xml).not.toContain(".md");
  });
});
