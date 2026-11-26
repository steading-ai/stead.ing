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
  /** Replaces the setup prompt a quick start step can offer (src/lib/prompt.ts). It should only point at this site's llms.txt. */
  setupPrompt: z.string().min(1).optional(),
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
  /**
   * One piece of work to show in the hero, taken through a workflow: the
   * steps in order, who runs each, and the fact that closed it. The page draws
   * it as a ledger with a card for one step at a time.
   */
  run: z
    .strictObject({
      title: z.string().min(1),
      /** The work being delivered. */
      work: z.strictObject({ ref: z.string().min(1), title: z.string().min(1) }),
      workflow: z.string().min(1),
      steps: z
        .array(
          z.strictObject({
            name: z.string().min(1),
            kind: z.string().min(1),
            state: z.enum(["closed", "running", "needs-you", "open"]),
            /** Who or what runs the step. */
            who: z.string().min(1),
            /** What has to be true for the step to close. */
            closes: z.string().min(1),
            /** The fact on record, once there is one: a commit, an exit code, an address. */
            proof: z.string().min(1).optional(),
            /** What this step shows about the project, in a sentence or two. */
            note: z.string().min(1),
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
            /**
             * Show a prompt, with its copy button, in this step: `true` for the site's prompt, `setup` for the one
             * asking the agent to set the project up. A step never sends the reader elsewhere on the page for it.
             */
            prompt: z.union([z.boolean(), z.literal("setup")]).optional(),
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
      sections: z
        .array(
          z.strictObject({
            title: z.string().min(1),
            /** A page's route, a folder's name with a slash after it, or either with a shorter name: `install: Install`. */
            pages: z
              .array(
                z.union([
                  z.string().min(1),
                  z.record(z.string().min(1), z.string().min(1)).refine((entry) => Object.keys(entry).length === 1, "Name one page per entry, as `page: Label`."),
                ]),
              )
              .min(1),
            collapsed: z.boolean().optional(),
          }),
        )
        .default([]),
    })
    .optional(),
});

export type Landing = z.infer<typeof landingSchema>;

/** A picture drawn twice, for the light and the dark color scheme, by its path in the content folder. */
const daylit = z.object({ light: z.string().min(1), dark: z.string().min(1) });

/** Frontmatter is optional. A page with none takes its title from its first heading. */
export const docSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  /** Position in the navigation; lower comes first. Pages without one sort after, by title. */
  order: z.number().optional(),
  /** A shorter name for the navigation than the page's title. */
  nav: z.string().min(1).optional(),
  /**
   * `story`: the page reads as a run of wide sections, one per `##` heading,
   * with no navigation beside it, for a page that tells a story rather than
   * documents something.
   */
  layout: z.enum(["story"]).optional(),
  /** A few words above a story's title: "The origin story". */
  kicker: z.string().min(1).optional(),
  /** A story's pictures, beside the section whose heading has this id, or `top` beside the title. */
  art: z.record(z.string(), daylit).optional(),
  /**
   * A section whose numbered list is a loop, drawn as a ring: a picture for
   * each item, in order, and one for the middle.
   */
  cycle: z.record(z.string(), z.object({ items: z.array(daylit).min(2), center: daylit.optional() })).optional(),
});
