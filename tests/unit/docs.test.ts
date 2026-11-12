import { describe, expect, it } from "vitest";
import { docMarkdown, navigation, ordered, toDoc } from "../../src/lib/docs.ts";
import { NO_SETTINGS, pathOf } from "../../src/lib/pages.ts";

/** A page of a project's docs, from its place under docs/ ("" is the README). */
function page(route: string, body: string, data: { title?: string; description?: string; order?: number } = {}, index = false) {
  const group = index ? route : route.includes("/") ? (route.split("/")[0] as string) : "";
  const file = route === "" ? "README.md" : `docs/${route}${index ? "/index" : ""}.md`;
  return toDoc({ file, route, path: pathOf("project", route), group, index, body, data });
}

const SITE = { origin: "https://skift.stead.ing", title: "skift" };

describe("toDoc", () => {
  it("prefers the frontmatter title, then the first heading, then the file name", () => {
    expect(page("a", "# Heading", { title: "Front" }).title).toBe("Front");
    expect(page("a", "# Heading").title).toBe("Heading");
    expect(page("guide/first-steps", "No heading.").title).toBe("First steps");
  });

  it("calls the first page the overview in the navigation, whatever its heading", () => {
    const readme = page("", "# Skift\n\nWhat it is.");
    expect(readme.title).toBe("Skift");
    expect(readme.label).toBe("Overview");
  });

  it("knows where the Markdown twin lives", () => {
    expect(page("guide/first", "# First").markdown).toBe("/docs/guide/first.md");
    expect(page("", "# Skift").markdown).toBe("/docs.md");
  });
});

describe("navigation", () => {
  const docs = [
    page("zebra", "# Zebra"),
    page("vision", "# Vision"),
    page("architecture", "# Architecture"),
    page("", "# Skift"),
    page("guide/second", "# Second"),
    page("guide", "# The guide", {}, true),
    page("guide/first", "# First"),
    page("adrs/002-later", "# 002: Later"),
    page("adrs/001-earlier", "# 001: Earlier"),
    page("plans/2026-09-prove", "# Prove the bet"),
  ];
  const nav = navigation(docs, "project", { ...NO_SETTINGS, order: ["vision", "architecture"], groups: { plans: "Where we're going" } });

  it("leads with the overview, then the pages in the order asked for, then the rest by title", () => {
    const [top] = nav;
    expect(top?.label).toBeUndefined();
    expect(top?.docs.map((doc) => doc.label)).toEqual(["Overview", "Vision", "Architecture", "Zebra"]);
  });

  it("names a folder as asked, or as known, or after its own page", () => {
    expect(nav.slice(1).map((group) => group.label)).toEqual(["Decisions", "The guide", "Where we're going"]);
  });

  it("keeps a folder's pages in file order, since records are numbered on purpose", () => {
    expect(nav.find((group) => group.label === "Decisions")?.docs.map((doc) => doc.title)).toEqual(["001: Earlier", "002: Later"]);
  });

  it("gives a folder with no page of its own one that lists its pages", () => {
    const decisions = nav.find((group) => group.label === "Decisions")?.index;
    expect(decisions).toMatchObject({ path: "/docs/adrs/", title: "Decisions", file: "" });
    expect(decisions?.lists?.map((doc) => doc.path)).toEqual(["/docs/adrs/001-earlier/", "/docs/adrs/002-later/"]);
  });

  it("uses a folder's own page where it has one, and doesn't list it twice", () => {
    const guide = nav.find((group) => group.label === "The guide");
    expect(guide?.index?.file).toBe("docs/guide/index.md");
    expect(guide?.docs.map((doc) => doc.title)).toEqual(["First", "Second"]);
  });

  it("flattens to one reading order, each folder's page ahead of its pages", () => {
    expect(ordered(nav).map((doc) => doc.path)).toEqual([
      "/docs/",
      "/docs/vision/",
      "/docs/architecture/",
      "/docs/zebra/",
      "/docs/adrs/",
      "/docs/adrs/001-earlier/",
      "/docs/adrs/002-later/",
      "/docs/guide/",
      "/docs/guide/first/",
      "/docs/guide/second/",
      "/docs/plans/",
      "/docs/plans/2026-09-prove/",
    ]);
  });
});

describe("docMarkdown", () => {
  it("leads with frontmatter an agent can cite from", () => {
    const markdown = docMarkdown(page("reference", "Body.", { title: "Reference", description: "Every command." }), SITE);
    expect(markdown).toBe(
      "---\ntitle: Reference\ncanonical: https://skift.stead.ing/docs/reference/\nsummary: Every command.\nsite: skift\n---\n\n# Reference\n\nBody.\n",
    );
  });

  it("doesn't repeat a heading the page already has", () => {
    const markdown = docMarkdown(page("guide/first", "# First steps\n\nBody."), SITE);
    expect(markdown.match(/^# /gm)).toHaveLength(1);
  });

  it("writes a folder's generated page as a list of its pages' twins", () => {
    const nav = navigation([page("adrs/001-earlier", "# 001: Earlier")], "project");
    const index = nav[0]?.index;
    if (!index) throw new Error("the folder has no page");
    expect(docMarkdown(index, SITE)).toContain("# Decisions\n\n- [001: Earlier](https://skift.stead.ing/docs/adrs/001-earlier.md)");
  });
});
