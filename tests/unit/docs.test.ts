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
    page("adrs/001-earlier", "# Store the plan in tables"),
    page("plans/2026-09-prove", "# Prove the bet"),
  ];
  const settings = { ...NO_SETTINGS, order: ["vision", "architecture"], groups: { plans: "Where we're going" } };
  const nav = navigation(docs, "project", settings);
  const folder = (label: string) => nav.flatMap((section) => section.items).find((item) => item.label === label);

  it("is one list when the site names no sections", () => {
    expect(nav).toHaveLength(1);
    expect(nav[0]).toMatchObject({ title: undefined, collapsed: false });
  });

  it("leads with the overview, then the pages in the order asked for, then the rest by title, then the folders", () => {
    expect(nav[0]?.items.map((item) => item.label)).toEqual(["Overview", "Vision", "Architecture", "Zebra", "Decisions", "The guide", "Where we're going"]);
  });

  it("names a folder as asked, or as known, or after its own page", () => {
    expect(nav[0]?.items.filter((item) => item.pages).map((item) => item.label)).toEqual(["Decisions", "The guide", "Where we're going"]);
  });

  it("keeps a folder's pages in file order, since records are numbered on purpose", () => {
    expect(folder("Decisions")?.pages?.map((item) => item.doc.title)).toEqual(["Store the plan in tables", "002: Later"]);
  });

  it("shows the number or date a record's file opens with, unless its title already does", () => {
    expect(folder("Decisions")?.pages?.map((item) => item.mark)).toEqual(["001", undefined]);
    expect(folder("Where we're going")?.pages?.map((item) => item.mark)).toEqual(["2026-09"]);
    expect(folder("The guide")?.pages?.map((item) => item.mark)).toEqual([undefined, undefined]);
  });

  it("gives a folder with no page of its own one that lists its pages", () => {
    const decisions = folder("Decisions")?.doc;
    expect(decisions).toMatchObject({ path: "/docs/adrs/", title: "Decisions", file: "" });
    expect(decisions?.lists?.map((doc) => doc.path)).toEqual(["/docs/adrs/001-earlier/", "/docs/adrs/002-later/"]);
  });

  it("uses a folder's own page where it has one, and doesn't list it twice", () => {
    const guide = folder("The guide");
    expect(guide?.doc.file).toBe("docs/guide/index.md");
    expect(guide?.pages?.map((item) => item.doc.title)).toEqual(["First", "Second"]);
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

  describe("in sections", () => {
    const sections = [
      { title: "Use it", pages: ["guide/", { zebra: "Stripes" }] },
      { title: "Build it", pages: ["architecture", "adrs/"], collapsed: true },
    ];
    const sectioned = navigation(docs, "project", { ...settings, sections });

    it("leads with the overview alone, then each section in the order given", () => {
      expect(sectioned.map((section) => section.title)).toEqual([undefined, "Use it", "Build it", "More"]);
      expect(sectioned[0]?.items.map((item) => item.label)).toEqual(["Overview"]);
    });

    it("puts in a section the pages and folders it lists, in its order, under the names it gives", () => {
      expect(sectioned[1]?.items.map((item) => item.label)).toEqual(["The guide", "Stripes"]);
      expect(sectioned[2]?.items.map((item) => item.label)).toEqual(["Architecture", "Decisions"]);
      expect(sectioned[1]?.items[1]?.doc.title).toBe("Zebra");
    });

    it("folds only the sections asked to fold", () => {
      expect(sectioned.map((section) => section.collapsed)).toEqual([false, false, true, false]);
    });

    it("keeps what no section lists, in a last section", () => {
      expect(sectioned[3]?.items.map((item) => item.label)).toEqual(["Vision", "Where we're going"]);
    });

    it("has no last section when every page is listed", () => {
      const all = [...sections, { title: "Why", pages: ["vision", "plans/"] }];
      expect(navigation(docs, "project", { ...settings, sections: all }).map((section) => section.title)).toEqual([undefined, "Use it", "Build it", "Why"]);
    });

    it("reads in the sections' order", () => {
      expect(ordered(sectioned).map((doc) => doc.path)).toEqual([
        "/docs/",
        "/docs/guide/",
        "/docs/guide/first/",
        "/docs/guide/second/",
        "/docs/zebra/",
        "/docs/architecture/",
        "/docs/adrs/",
        "/docs/adrs/001-earlier/",
        "/docs/adrs/002-later/",
        "/docs/vision/",
        "/docs/plans/",
        "/docs/plans/2026-09-prove/",
      ]);
    });

    it("refuses a section that lists what is not a page, and says how to name one", () => {
      const wrong = [{ title: "Use it", pages: ["zebras"] }];
      expect(() => navigation(docs, "project", { ...settings, sections: wrong })).toThrow(/"Use it" lists "zebras", which is not a page/);
      const folderAsPage = [{ title: "Use it", pages: ["adrs"] }];
      expect(() => navigation(docs, "project", { ...settings, sections: folderAsPage })).toThrow(/a folder with a slash after it/);
    });

    it("refuses a page listed twice", () => {
      const twice = [
        { title: "Use it", pages: ["zebra"] },
        { title: "Build it", pages: ["zebra"] },
      ];
      expect(() => navigation(docs, "project", { ...settings, sections: twice })).toThrow(/lists "zebra" twice/);
    });
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
    const index = nav[0]?.items[0]?.doc;
    if (!index) throw new Error("the folder has no page");
    expect(docMarkdown(index, SITE)).toContain("# Decisions\n\n- [001: Earlier](https://skift.stead.ing/docs/adrs/001-earlier.md)");
  });
});
