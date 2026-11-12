/**
 * What the sites may say to an agent.
 *
 * llms.txt, the Markdown front page and robots.txt are read by language
 * models. Text there that tells the reader what to do ("ask them what they
 * are building", "say so if it is not a fit") is a prompt injection as far as
 * the model and anything guarding it can tell, whatever its intent, and gets
 * the site flagged. So those files state facts and never give instructions.
 * A visitor who wants their agent to do something says so themselves, in the
 * prompt they paste.
 *
 * This is a guard, not a proof: it catches the phrasings an instruction
 * usually takes. A test runs it over everything the sites generate for agents.
 */

const PATTERNS: [RegExp, string][] = [
  [/\byou (should|must|need to|have to|will|are an?)\b/i, "tells the reader what they should do"],
  [/\bif you(['’]re| are) (an? )?(agent|assistant|ai|model|llm|helping|asked)\b/i, "addresses the reader as an agent"],
  [/\b(as an? (agent|assistant|ai|model))\b/i, "addresses the reader as an agent"],
  [/\b(system prompt|ignore (all |any |the )?(previous|prior|above)|disregard)\b/i, "talks about the reader's instructions"],
  [/\binstructions? (for|to) (the |an? |any )?(agent|assistant|ai|model|llm)s?\b/i, "announces instructions for an agent"],
  [
    /((?:^|\n)\s*(?:[-*]\s+)?|[.!?:]\s+)(ask|tell|say|recommend|suggest|advise|match|send|direct|point|follow|obey|pretend|act as|respond|reply|answer|always|never|do not|don['’]t|make sure|ensure|remember|note that|please|warn|inform|start by|begin by|help|use|read|fetch|visit|check|consider|prefer|avoid|treat)\b/i,
    "opens a sentence with a command",
  ],
];

/** The first instruction found in text meant for agents, or undefined if it only states facts. */
export function instructionIn(text: string): { phrase: string; why: string } | undefined {
  for (const [pattern, why] of PATTERNS) {
    const match = pattern.exec(text);
    if (match) return { phrase: match[0].trim(), why };
  }
  return undefined;
}
