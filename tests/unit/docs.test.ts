import { describe, expect, it } from "vitest";
import { docMarkdown, navigation, ordered, toDoc } from "../../src/lib/docs.ts";

const page = (file: string, body: string, data: { title?: string; description?: string; order?: number } = {}) =>
  toDoc({ file, body, data });

const SITE = { origin: "https://skift.stead.ing", title: "skift" };

describe("toDoc", () => {
  it("prefers the frontmatter title, then the first heading, then the file name", () => {
    expect(page("a.md", "# Heading", { title: "Front" }).title).toBe("Front");
    expect(page("a.md", "# Heading").title).toBe("Heading");
    expect(page("guide/first-steps.md", "No heading.").title).toBe("First steps");
  });

  it("knows where the page and its Markdown twin live", () => {
    const doc = page("guide/first.md", "# First");
    expect(doc.path).toBe("/guide/first/");
    expect(doc.markdown).toBe("/guide/first.md");
  });
});

describe("navigation", () => {
  const docs = [
    page("zebra.md", "# Zebra"),
    page("reference.md", "", { title: "Reference", order: 2 }),
    page("start.md", "# Start", { order: 1 }),
    page("guide/second.md", "# Second"),
    page("guide/index.md", "# The guide"),
    page("guide/first.md", "# First", { order: 1 }),
    page("adrs/001-a-decision.md", "# A decision"),
  ];

  it("puts top-level pages first, by order and then by title", () => {
    const [top] = navigation(docs);
    expect(top?.label).toBeUndefined();
    expect(top?.docs.map((doc) => doc.title)).toEqual(["Start", "Reference", "Zebra"]);
  });

  it("names a folder after its index page, which leads it", () => {
    const guide = navigation(docs).find((group) => group.label === "The guide");
    expect(guide?.docs.map((doc) => doc.title)).toEqual(["The guide", "First", "Second"]);
  });

  it("names a folder without an index page after itself", () => {
    expect(navigation(docs).map((group) => group.label)).toEqual([undefined, "Adrs", "The guide"]);
  });

  it("flattens to one reading order", () => {
    expect(ordered(docs).map((doc) => doc.path)).toEqual([
      "/start/",
      "/reference/",
      "/zebra/",
      "/adrs/001-a-decision/",
      "/guide/",
      "/guide/first/",
      "/guide/second/",
    ]);
  });
});

describe("docMarkdown", () => {
  it("leads with frontmatter an agent can cite from", () => {
    const markdown = docMarkdown(page("reference.md", "Body.", { title: "Reference", description: "Every command." }), SITE);
    expect(markdown).toBe(
      "---\ntitle: Reference\ncanonical: https://skift.stead.ing/reference/\nsummary: Every command.\nsite: skift\n---\n\n# Reference\n\nBody.\n",
    );
  });

  it("doesn't repeat a heading the page already has", () => {
    const markdown = docMarkdown(page("guide/first.md", "# First steps\n\nBody."), SITE);
    expect(markdown.match(/^# /gm)).toHaveLength(1);
  });
});
