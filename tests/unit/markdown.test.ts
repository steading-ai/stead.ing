import { describe, expect, it } from "vitest";
import { inline, leadingTitle, type LinkTargets, markdownPath, resolveLink } from "../../src/lib/markdown.ts";

const targets: LinkTargets = {
  root: "/repo",
  pages: new Map([
    ["README.md", "/docs/"],
    ["docs/reference.md", "/docs/reference/"],
    ["docs/guide/index.md", "/docs/guide/"],
    ["docs/guide/first.md", "/docs/guide/first/"],
  ]),
  folders: new Map([
    ["docs", "/docs/"],
    ["docs/guide", "/docs/guide/"],
    ["docs/adrs", "/docs/adrs/"],
  ]),
  source: { blob: "https://example.com/blob/main", tree: "https://example.com/tree/main" },
};

describe("markdownPath", () => {
  it.each([
    ["/", "/index.md"],
    ["/docs/", "/docs.md"],
    ["/docs/guide/first/", "/docs/guide/first.md"],
  ])("the twin of %s is %s", (page, twin) => {
    expect(markdownPath(page)).toBe(twin);
  });
});

describe("resolveLink", () => {
  const from = "/repo/docs/guide/first.md";

  it.each([
    ["index.md", "/docs/guide/"],
    ["../reference.md", "/docs/reference/"],
    ["../reference.md#commands", "/docs/reference/#commands"],
    ["../../README.md", "/docs/"],
  ])("points a link to a page, %s, at %s", (href, expected) => {
    expect(resolveLink(href, from, targets)).toBe(expected);
  });

  it.each([
    ["../adrs/", "/docs/adrs/"],
    ["../adrs", "/docs/adrs/"],
    ["../", "/docs/"],
  ])("points a link to a folder of pages, %s, at the folder's page", (href, expected) => {
    expect(resolveLink(href, from, targets)).toBe(expected);
  });

  it.each([
    ["../../src/main.go", "https://example.com/blob/main/src/main.go"],
    ["../../LICENSE#terms", "https://example.com/blob/main/LICENSE#terms"],
    ["../../packaging/", "https://example.com/tree/main/packaging"],
    ["second.md", "https://example.com/blob/main/docs/guide/second.md"],
  ])("sends a link to anything else in the project, %s, to its source", (href, expected) => {
    expect(resolveLink(href, from, targets)).toBe(expected);
  });

  it.each(["https://example.com/readme.md", "mailto:someone@example.com", "#then", "/already/a/page/", "../../../outside.md"])(
    "leaves %s alone",
    (href) => {
      expect(resolveLink(href, from, targets)).toBe(href);
    },
  );

  it("leaves a link that is not a page alone when the project's source is not on the web", () => {
    expect(resolveLink("../../src/main.go", from, { ...targets, source: undefined })).toBe("../../src/main.go");
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
  it("renders code, bold, emphasis, and links", () => {
    expect(inline("Needs `PostgreSQL`, **really**, and *first*. See [the guide](/guide/).")).toBe(
      'Needs <code>PostgreSQL</code>, <strong>really</strong>, and <em>first</em>. See <a href="/guide/">the guide</a>.',
    );
  });

  it("escapes everything else", () => {
    expect(inline('<script>alert("x")</script> & [bad](javascript:alert(1))')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; [bad](javascript:alert(1))",
    );
  });
});
