import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { docSchema, landingSchema } from "./lib/schema.ts";
import { SITE } from "./site.ts";

/** Stands in for the pages loader while a content folder has no pages, which `glob` would warn about. */
const noPages: Loader = { name: "no-pages", load: async () => {} };

export const collections = {
  /** `site.yaml`: which project this is, and the copy for its front page. */
  landing: defineCollection({
    loader: glob({ base: SITE.contentDir, pattern: "site.yaml" }),
    schema: landingSchema,
  }),
  /** Every Markdown file in the content folder is a page. */
  docs: defineCollection({
    loader: SITE.hasPages ? glob({ base: SITE.contentDir, pattern: "**/*.md" }) : noPages,
    schema: docSchema,
  }),
};
