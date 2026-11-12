import { describe, expect, it } from "vitest";
import { folders, NO_SETTINGS, scanPages } from "../../src/lib/pages.ts";

const PROJECT = new URL("../fixtures/site", import.meta.url).pathname;
const HUB = new URL("../../content", import.meta.url).pathname;
const settings = { ...NO_SETTINGS, exclude: ["docs/adrs/000-template.md", "docs/drafts/"] };

describe("a project's pages", () => {
  const pages = scanPages(PROJECT, "project", settings);
  const byFile = new Map(pages.map((page) => [page.file, page]));

  it("makes the README the first page of the docs", () => {
    expect(byFile.get("README.md")).toMatchObject({ route: "", path: "/docs/", group: "", index: false });
  });

  it("gives every Markdown file under docs/ a page in the same shape as the folder", () => {
    expect(byFile.get("docs/reference.md")).toMatchObject({ path: "/docs/reference/", group: "" });
    expect(byFile.get("docs/guide/first.md")).toMatchObject({ path: "/docs/guide/first/", group: "guide", index: false });
    expect(byFile.get("docs/adrs/001-first-decision.md")).toMatchObject({ path: "/docs/adrs/001-first-decision/", group: "adrs" });
  });

  it("makes a folder's index its own page", () => {
    expect(byFile.get("docs/guide/index.md")).toMatchObject({ route: "guide", path: "/docs/guide/", group: "guide", index: true });
  });

  it("leaves out excluded files and folders", () => {
    expect(byFile.has("docs/adrs/000-template.md")).toBe(false);
    expect(byFile.has("docs/drafts/unfinished.md")).toBe(false);
    expect(scanPages(PROJECT, "project").some((page) => page.file === "docs/drafts/unfinished.md")).toBe(true);
  });

  it("takes nothing from outside the README and docs/", () => {
    for (const page of pages) expect(page.file === "README.md" || page.file.startsWith("docs/")).toBe(true);
  });

  it("knows each folder of pages, including one with no page of its own", () => {
    expect(Object.fromEntries(folders(pages, "project"))).toEqual({ docs: "/docs/", "docs/guide": "/docs/guide/", "docs/adrs": "/docs/adrs/" });
  });
});

describe("the hub's pages", () => {
  const pages = scanPages(HUB, "hub");

  it("puts each page at the top of the site", () => {
    expect(pages.find((page) => page.file === "how-we-work.md")).toMatchObject({ route: "how-we-work", path: "/how-we-work/", group: "" });
  });

  it("refuses a page that would replace the front page", () => {
    expect(() => scanPages(new URL("../fixtures/site/docs/guide", import.meta.url).pathname, "hub")).toThrow(/front page/);
  });
});
