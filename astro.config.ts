import { satteri } from "@astrojs/markdown-satteri";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { rewriteDocLinks } from "./src/lib/markdown.ts";
import { SITE } from "./src/site.ts";

export default defineConfig({
  site: SITE.origin,
  outDir: SITE.outDir,
  // One codebase builds many sites; each keeps its own cache so no site's content reaches another's build.
  cacheDir: `node_modules/.astro/${SITE.cacheKey}`,
  // A page is a folder with an index.html, so every static host serves the same addresses.
  trailingSlash: "always",
  markdown: {
    processor: satteri({
      hastPlugins: [
        rewriteDocLinks({
          root: SITE.contentDir,
          pages: new Map(SITE.pages.map((page) => [page.file, page.path])),
          folders: SITE.folders,
          source: SITE.source,
        }),
      ],
    }),
    // Two themes in one render; global.css switches between them with the color scheme.
    // The high-contrast themes keep every token, comments included, at WCAG AA on Loam's and Daylight's surfaces.
    shikiConfig: { themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" }, defaultColor: false },
  },
  vite: { plugins: [tailwindcss()] },
});
