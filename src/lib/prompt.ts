/**
 * The prompts a visitor pastes into their own agent. Every site asks the same
 * plain questions, about itself, so they are written once here. They only
 * point at the site's llms.txt: the visitor is the one giving their agent an
 * instruction, and llms.txt answers with facts.
 */
type Site = { origin: string; name: string; isHub: boolean };

/** The hero's prompt: is this a fit for what I do? */
export function promptFor(site: Site): string {
  const subject = site.isHub ? "it's" : `${site.name} is`;
  return `Read ${site.origin}/llms.txt and help me figure out if ${subject} a good fit for my work.`;
}

/**
 * The quick start's prompt: set it up for me. Someone who has got this far has
 * decided, so they ask their agent to do the work rather than explain it, with
 * their go-ahead first and a check at the end.
 */
export function setupPromptFor(site: Site): string {
  const subject = site.isHub ? "it" : site.name;
  return `Read ${site.origin}/llms.txt and set ${subject} up on this machine for me. Ask before you change anything, then run each step yourself rather than handing me commands, and finish by checking that it works.`;
}
