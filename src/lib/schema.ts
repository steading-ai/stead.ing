import { z } from "astro/zod";
import { instructionIn } from "./policy.ts";

/** Text that ends up in llms.txt: it may state facts, and may not tell an agent what to do (policy.ts). */
const facts = z
  .string()
  .min(1)
  .superRefine((text, context) => {
    const found = instructionIn(text);
    if (found) {
      context.addIssue({
        code: "custom",
        message: `"${found.phrase}" ${found.why}. This text is published in llms.txt, which states facts and never instructs an agent.`,
      });
    }
  });

const item = z.strictObject({ title: z.string().min(1), body: z.string().min(1) });

/** What a content folder's `site.yaml` may say. README.md documents each field. */
export const landingSchema = z.strictObject({
  project: z.string().min(1),
  headline: z.string().min(1),
  summary: facts,
  /** Replaces the prompt every site offers (src/lib/prompt.ts). It should only point at this site's llms.txt. */
  prompt: z.string().min(1).optional(),
  /** Who the project suits and who it does not, as statements of fact. Published in llms.txt. */
  fit: facts.optional(),
  install: z.strictObject({ command: z.string().min(1), note: z.string().optional() }).optional(),
  facts: z.array(z.string().min(1)).default([]),
  /**
   * A small plan to show in the hero: pieces of work, what each waits on, and
   * how each stands. The page draws it as a graph with a card for one node at a
   * time.
   */
  demo: z
    .strictObject({
      title: z.string().min(1),
      nodes: z
        .array(
          z.strictObject({
            ref: z.string().min(1),
            title: z.string().min(1),
            kind: z.string().min(1),
            priority: z.string().min(1),
            state: z.enum(["done", "ready", "claimed", "blocked", "needs-you", "held"]),
            /** Who it is for, or who has it. */
            who: z.string().min(1),
            /** What this state means, in a sentence or two. */
            note: z.string().min(1),
            /** The refs of the nodes it waits on. */
            waits: z.array(z.string().min(1)).default([]),
          }),
        )
        .min(2),
    })
    .optional(),
  /** A demonstration on video. Until there is an address, the page holds its place. */
  video: z.strictObject({ caption: z.string().min(1), url: z.url().optional() }).optional(),
  /** What the project offers, said plainly: a heading, and a list. */
  offers: z.strictObject({ title: z.string().min(1), items: z.array(item).min(1) }).optional(),
  /** How the project thinks about its problem: a few ideas, each leading into the docs. */
  thinking: z
    .strictObject({
      title: z.string().min(1),
      items: z.array(z.strictObject({ title: z.string().min(1), body: z.string().min(1), href: z.string().min(1).optional() })).min(1),
    })
    .optional(),
  /** The first few minutes with the project, as steps in order. */
  quickstart: z
    .strictObject({
      title: z.string().min(1),
      steps: z
        .array(
          z.strictObject({
            title: z.string().min(1),
            body: z.string().min(1),
            code: z.string().min(1).optional(),
            /** Show the site's prompt, with its copy button, in this step. A step never sends the reader elsewhere on the page for it. */
            prompt: z.boolean().optional(),
          }),
        )
        .min(1),
    })
    .optional(),
  /** Where to begin, by the situation someone is in. */
  starts: z.array(item).default([]),
  /** What the project is not: the thing, why not, and the project to use for it. */
  not: z.array(z.strictObject({ title: z.string().min(1), body: z.string().min(1), use: z.string().min(1).optional() })).default([]),
  /** A line after the "is not" table, saying what the project is for. */
  instead: z.string().optional(),
  pairs: z.array(z.strictObject({ project: z.string().min(1), body: z.string().min(1) })).default([]),
  /** How a project's docs are arranged (src/lib/pages.ts). */
  docs: z
    .strictObject({
      order: z.array(z.string().min(1)).default([]),
      exclude: z.array(z.string().min(1)).default([]),
      groups: z.record(z.string(), z.string().min(1)).default({}),
    })
    .optional(),
});

export type Landing = z.infer<typeof landingSchema>;

/** Frontmatter is optional. A page with none takes its title from its first heading. */
export const docSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  /** Position in the navigation; lower comes first. Pages without one sort after, by title. */
  order: z.number().optional(),
});
