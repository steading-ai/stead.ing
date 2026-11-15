import { cpSync, createReadStream, mkdirSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { satteri } from "@astrojs/markdown-satteri";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { rewriteDocImages, rewriteDocLinks, scrollWideTables } from "./src/lib/markdown.ts";
import { SITE } from "./src/site.ts";

/** The kinds of picture src/lib/pages.ts finds beside a site's pages. */
const PICTURE_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * The dev server answers for the pictures beside a site's pages at the same
 * addresses a build copies them to, so a page shows its pictures before it is
 * built. A Vite plugin's own middleware runs before Astro's routing, which
 * would otherwise add the trailing slash every page address has and answer 404.
 */
const picturesByAddress = new Map([...SITE.images].map(([file, address]) => [address, file]));
function servePagePicture(request: IncomingMessage, response: ServerResponse, next: () => void) {
  const file = picturesByAddress.get(decodeURIComponent((request.url ?? "").split("?")[0] ?? ""));
  if (!file) return next();
  response.setHeader("Content-Type", PICTURE_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream");
  createReadStream(join(SITE.contentDir, file)).pipe(response);
}

const targets = {
  root: SITE.contentDir,
  pages: new Map(SITE.pages.map((page) => [page.file, page.path])),
  folders: SITE.folders,
  images: SITE.images,
  source: SITE.source,
};

export default defineConfig({
  site: SITE.origin,
  outDir: SITE.outDir,
  // One codebase builds many sites; each keeps its own cache so no site's content reaches another's build.
  cacheDir: `node_modules/.astro/${SITE.cacheKey}`,
  // A page is a folder with an index.html, so every static host serves the same addresses.
  trailingSlash: "always",
  markdown: {
    processor: satteri({
      hastPlugins: [rewriteDocLinks(targets), rewriteDocImages(targets), scrollWideTables()],
    }),
    // Two themes in one render; global.css switches between them with the color scheme.
    // The high-contrast themes keep every token, comments included, at WCAG AA on Loam's and Daylight's surfaces.
    shikiConfig: { themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" }, defaultColor: false },
  },
  integrations: [
    {
      // The pictures beside a site's pages are served where the pages point at them.
      name: "steading-images",
      hooks: {
        "astro:build:done": ({ dir }) => {
          for (const [file, address] of SITE.images) {
            const to = join(fileURLToPath(dir), address);
            mkdirSync(dirname(to), { recursive: true });
            cpSync(join(SITE.contentDir, file), to);
          }
        },
      },
    },
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: "steading-page-pictures",
        configureServer(server) {
          server.middlewares.use(servePagePicture);
        },
      },
    ],
  },
});
