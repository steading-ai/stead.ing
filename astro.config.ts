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
    processor: satteri({ hastPlugins: [rewriteDocLinks({ root: SITE.contentDir })] }),
    // Two themes in one render; global.css switches between them with the color scheme.
    // The high-contrast light theme keeps every token at WCAG AA on Daylight's surface.
    shikiConfig: { themes: { light: "github-light-high-contrast", dark: "github-dark" }, defaultColor: false },
  },
  vite: { plugins: [tailwindcss()] },
});
