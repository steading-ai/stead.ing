/**
 * The prompt a visitor pastes into their own agent. Every site asks the same
 * plain question, about itself, so it is written once here. It only points at
 * the site's llms.txt: the visitor is the one giving their agent an
 * instruction, and llms.txt answers with facts.
 */
export function promptFor(site: { origin: string; name: string; isHub: boolean }): string {
  const subject = site.isHub ? "it's" : `${site.name} is`;
  return `Read ${site.origin}/llms.txt and help me figure out if ${subject} a good fit for my work.`;
}
