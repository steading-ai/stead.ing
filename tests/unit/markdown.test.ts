import { describe, expect, it } from "vitest";
import { inline, leadingTitle, markdownPath, pagePath, rewriteLink } from "../../src/lib/markdown.ts";

const ROOT = "/repo/site";

describe("pagePath", () => {
  it.each([
    ["reference.md", "/reference/"],
    ["guide/first.md", "/guide/first/"],
    ["guide/index.md", "/guide/"],
    ["index.md", "/"],
  ])("%s lives at %s", (file, path) => {
    expect(pagePath(file)).toBe(path);
  });
});

describe("markdownPath", () => {
  it.each([
    ["/", "/index.md"],
    ["/reference/", "/reference.md"],
    ["/guide/first/", "/guide/first.md"],
  ])("the twin of %s is %s", (page, twin) => {
    expect(markdownPath(page)).toBe(twin);
  });
});

describe("rewriteLink", () => {
  const from = `${ROOT}/guide/first.md`;

  it.each([
    ["index.md", "/guide/"],
    ["../reference.md", "/reference/"],
    ["../reference.md#commands", "/reference/#commands"],
    ["./second.md", "/guide/second/"],
  ])("points %s at %s", (href, expected) => {
    expect(rewriteLink(href, from, ROOT)).toBe(expected);
  });

  it.each([
    "https://example.com/readme.md",
    "mailto:someone@example.com",
    "#then",
    "/already/a/page/",
    "diagram.png",
    "../../README.md",
  ])("leaves %s alone", (href) => {
    expect(rewriteLink(href, from, ROOT)).toBe(href);
  });
});

describe("leadingTitle", () => {
  it("reads a heading on the first line", () => {
    expect(leadingTitle("# First steps\n\nBody")).toBe("First steps");
    expect(leadingTitle("\n\n# Spaced out #\nBody")).toBe("Spaced out");
  });

  it("ignores headings that aren't first, or aren't level one", () => {
    expect(leadingTitle("Intro\n\n# Later")).toBeUndefined();
    expect(leadingTitle("## Section")).toBeUndefined();
  });
});

describe("inline", () => {
  it("renders code, bold, and links", () => {
    expect(inline("Needs `PostgreSQL`, **really**. See [the guide](/guide/).")).toBe(
      'Needs <code>PostgreSQL</code>, <strong>really</strong>. See <a href="/guide/">the guide</a>.',
    );
  });

  it("escapes everything else", () => {
    expect(inline('<script>alert("x")</script> & [bad](javascript:alert(1))')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; [bad](javascript:alert(1))",
    );
  });
});
