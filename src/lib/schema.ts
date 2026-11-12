import { z } from "astro/zod";

const item = z.strictObject({ title: z.string().min(1), body: z.string().min(1) });

/** What a content folder's `site.yaml` may say. README.md documents each field. */
export const landingSchema = z.strictObject({
  project: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  /** The prompt a visitor pastes into their agent. It should only point at this site's llms.txt. */
  prompt: z.string().min(1),
  /** Advice to an agent helping someone with this project; goes in llms.txt. */
  agent: z.string().optional(),
  install: z.strictObject({ command: z.string().min(1), note: z.string().optional() }).optional(),
  facts: z.array(z.string().min(1)).default([]),
  starts: z.array(item).default([]),
  features: z.array(item).default([]),
  not: z.array(item).default([]),
  /** A line after the "is not" list, for pointing at a better fit. */
  instead: z.string().optional(),
  pairs: z.array(z.strictObject({ project: z.string().min(1), body: z.string().min(1) })).default([]),
});

export type Landing = z.infer<typeof landingSchema>;

/** Frontmatter is optional. A page with none takes its title from its first heading. */
export const docSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  /** Position in the navigation; lower comes first. Pages without one sort after, by title. */
  order: z.number().optional(),
});
