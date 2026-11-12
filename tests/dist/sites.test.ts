import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { instructionIn } from "../../src/lib/policy.ts";

/** Each site `pnpm build:all` produces, and the address it will be served from. */
const SITES = {
  steading: "https://stead.ing",
  skift: "https://skift.stead.ing",
  fixture: "https://skift.stead.ing",
};

const DIST = new URL("../../dist/", import.meta.url).pathname;

const files = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));

/** Whether a static host would answer a site-relative address. */
function resolves(root: string, address: string): boolean {
  const path = decodeURIComponent(address.split(/[?#]/)[0] ?? "");
  const target = join(root, path);
  return path.endsWith("/") ? existsSync(join(target, "index.html")) : existsSync(target);
}

for (const [name, origin] of Object.entries(SITES)) {
  const root = join(DIST, name);

  describe.runIf(existsSync(root))(`the ${name} site`, () => {
    const pages = files(root).filter((file) => file.endsWith(".html"));
    const html = (file: string) => readFileSync(join(root, file), "utf8");

    it("has a front page and the files agents look for", () => {
      for (const file of ["index.html", "index.md", "llms.txt", "llms-full.txt", "robots.txt", "sitemap.xml", "favicon.svg", "404.html"]) {
        expect(existsSync(join(root, file)), file).toBe(true);
      }
    });

    it("links only to addresses that exist", () => {
      const broken: string[] = [];
      for (const page of pages) {
        for (const [, address = ""] of html(page).matchAll(/\s(?:href|src)="([^"]+)"/g)) {
          const local = address.startsWith(origin) ? address.slice(origin.length) : address;
          if (!local.startsWith("/") || local.startsWith("//")) continue;
          if (!resolves(root, local)) broken.push(`${page} → ${address}`);
        }
      }
      expect(broken).toEqual([]);
    });

    it("gives every page a Markdown twin and says where it is", () => {
      for (const page of pages.filter((file) => file !== "404.html")) {
        const twin = page === "index.html" ? "index.md" : page.replace(/\/index\.html$/, ".md");
        expect(existsSync(join(root, twin)), twin).toBe(true);
        expect(html(page)).toContain(`<link rel="alternate" type="text/markdown" href="${origin}/${twin}"`);
      }
    });

    it("lists only Markdown that exists in llms.txt", () => {
      const listed = [...readFileSync(join(root, "llms.txt"), "utf8").matchAll(/\]\((https:\/\/[^)]+)\)/g)]
        .map(([, address = ""]) => address)
        .filter((address) => address.startsWith(`${origin}/`));
      expect(listed.length).toBeGreaterThan(0);
      for (const address of listed) expect(resolves(root, address.slice(origin.length)), address).toBe(true);
    });

    it("states facts to agents and gives them no instructions", () => {
      for (const file of ["llms.txt", "index.md", "robots.txt"]) {
        expect(instructionIn(readFileSync(join(root, file), "utf8")), file).toBeUndefined();
      }
    });

    it("names one h1 per page, a language, and a main landmark", () => {
      for (const page of pages) {
        const source = html(page);
        expect(source.match(/<h1[\s>]/g), `${page}: h1`).toHaveLength(1);
        expect(source).toMatch(/<html lang="en"/);
        expect(source).toContain('<main id="main"');
      }
    });

    it("loads nothing from another origin", () => {
      for (const page of pages) {
        const external = [...html(page).matchAll(/<(?:script|link|img)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)]
          .map(([tag = "", address = ""]) => ({ tag, address }))
          .filter(({ tag }) => /<script|<img|rel="stylesheet"|rel="preload"/.test(tag));
        expect(external, page).toEqual([]);
      }
    });

    it("keeps its fonts under the 120 KB budget", () => {
      const fonts = files(root).filter((file) => /\.woff2?$/.test(file));
      const woff2 = fonts.filter((file) => file.endsWith(".woff2"));
      expect(woff2.length).toBeGreaterThan(0);
      const bytes = woff2.reduce((total, file) => total + readFileSync(join(root, file)).byteLength, 0);
      expect(bytes).toBeLessThan(120 * 1024);
    });
  });
}

describe("the hub", () => {
  const root = join(DIST, "steading");

  it.runIf(existsSync(root))("has every page the other sites' footers link to", async () => {
    const { HUB_PAGES } = await import("../../src/site.ts");
    for (const page of HUB_PAGES) expect(existsSync(join(root, page.path, "index.html")), page.path).toBe(true);
  });
});

describe("the fixture site", () => {
  const root = join(DIST, "fixture");
  const read = (file: string) => readFileSync(join(root, file), "utf8");

  it.runIf(existsSync(root))("points links between Markdown files at pages", () => {
    const first = read("guide/first/index.html");
    expect(first).toContain('href="/reference/"');
    expect(first).toContain('href="/guide/"');
    expect(read("reference/index.html")).toContain('href="/guide/first/#then"');
  });

  it.runIf(existsSync(root))("leaves those links as written in the Markdown twin", () => {
    expect(read("guide/first.md")).toContain("(../reference.md)");
  });

  it.runIf(existsSync(root))("escapes what site.yaml says", () => {
    expect(read("index.html")).toContain("&lt;angle brackets&gt;");
  });
});
