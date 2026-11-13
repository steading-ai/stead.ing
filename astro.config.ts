import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { satteri } from "@astrojs/markdown-satteri";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { rewriteDocImages, rewriteDocLinks, scrollWideTables } from "./src/lib/markdown.ts";
import { SITE } from "./src/site.ts";

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
  vite: { plugins: [tailwindcss()] },
});
