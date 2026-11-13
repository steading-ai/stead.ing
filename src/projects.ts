/**
 * Every Steading project: its name, its one job, how far along it is, and its
 * color and mark. The hub's cards, the product map, the strip of projects on
 * every site, and each `llms.txt` read from here, so a project is described once.
 */

export type Status = "running" | "early" | "design";

export const STATUS_LABEL: Record<Status, string> = {
  running: "Running daily",
  early: "Early",
  design: "In design",
};

export const GLYPHS = [
  "console",
  "skift",
  "mill",
  "croft",
  "almanac",
  "thicket",
  "fallow",
  "stead",
  "gateway",
  "knowledge",
] as const;
export type Glyph = (typeof GLYPHS)[number];

/** What a project is for, in the order the Projects menu lists them. */
export const GROUPS = {
  deliver: "Plan and deliver",
  fence: "Fence it in",
  maintain: "Keep it maintained",
  reach: "Ways in",
} as const;
export type Group = keyof typeof GROUPS;

export interface Project {
  id: string;
  /** Lowercase, as the wordmark writes it. */
  name: string;
  /** What it is, for someone who has never heard its name: "A task graph agents and people share". */
  what: string;
  /** What it does, in a few words: "Holds the plan". */
  job: string;
  group: Group;
  /** The problem it answers, in the words of someone who has it. Visitors scan for these. */
  pain: string;
  /** One sentence on what it does about that. */
  blurb: string;
  /** A measured instance of the problem, where there is one. */
  measured?: string;
  status: Status;
  /** The accent on Loam (dark) and on Daylight (light). */
  color: { dark: string; light: string };
  glyph: Glyph;
  /** Set once `<id>.stead.ing` is deployed. Nothing links to a site before that. */
  site?: string;
  /** Set once the repository is public. */
  repo?: string;
}

/** The hub itself: Steading's ember, and the courtyard's plain light. */
export const STEADING: Project = {
  id: "steading",
  name: "steading",
  what: "The platform these projects make up",
  group: "deliver",
  job: "One person. A thousand agents.",
  pain: "I have more ideas than hours.",
  blurb: "Open-source projects for planning, running, fencing, and watching AI agents on machines you own.",
  status: "running",
  color: { dark: "#E8743B", light: "#B84A16" },
  glyph: "console",
  site: "https://stead.ing/",
  repo: "https://github.com/steading-ai/stead.ing",
};

export const PROJECTS: readonly Project[] = [
  {
    id: "console",
    name: "console",
    what: "A web console for everything your agents do",
    group: "deliver",
    job: "Ties it all together",
    pain: "I can't see what my agents did overnight, or what it cost.",
    blurb: "Shows what every project is doing and what needs a person, on a phone as well as a desk.",
    status: "running",
    color: { dark: "#E8743B", light: "#B84A16" },
    glyph: "console",
  },
  {
    id: "skift",
    name: "skift",
    what: "A task graph agents and people share",
    group: "deliver",
    job: "Holds the plan",
    pain: "My agents step on each other, and nobody knows what's ready.",
    blurb: "One plan for every agent, on every machine. It always knows what's ready.",
    status: "running",
    color: { dark: "#7FB2E5", light: "#2E62A3" },
    glyph: "skift",
    site: "https://skift.stead.ing/",
    repo: "https://github.com/steading-ai/skift",
  },
  {
    id: "mill",
    name: "mill",
    what: "A runner that delivers tasks as merged changes",
    group: "deliver",
    job: "Does the work",
    pain: "I babysit every task until it's merged.",
    blurb: "Takes a ready task to a merged, running change, with proof at every step.",
    status: "running",
    color: { dark: "#E2B84F", light: "#8A6410" },
    glyph: "mill",
    repo: "https://github.com/steading-ai/mill",
  },
  {
    id: "almanac",
    name: "almanac",
    what: "Automatic repair for broken dependency updates",
    group: "maintain",
    job: "Keeps things maintained",
    pain: "Dependency updates pile up faster than I merge them.",
    blurb: "Repairs broken dependency updates for tens of cents.",
    measured: "One account: 97 of 119 open pull requests.",
    status: "early",
    color: { dark: "#E79AAE", light: "#A63D5F" },
    glyph: "almanac",
    repo: "https://github.com/steading-ai/almanac",
  },
  {
    id: "thicket",
    name: "thicket",
    what: "Agents you reach from Slack or a phone call",
    group: "reach",
    job: "Agents you can talk to",
    pain: "I want to hand an idea to an agent from my phone.",
    blurb: "Agents on the systems you run, reachable from Slack or a phone call.",
    status: "early",
    color: { dark: "#B9A2EC", light: "#6A4BB0" },
    glyph: "thicket",
    site: "https://thicket.stead.ing/",
    repo: "https://github.com/steading-ai/thicket",
  },
  {
    id: "stead",
    name: "stead",
    what: "One command that runs Steading on a Mac",
    group: "reach",
    job: "Puts it on your Mac",
    pain: "I'm on a Mac, and all of this wants Linux.",
    blurb: "Runs skift and mill on your Mac.",
    status: "early",
    color: { dark: "#D8CDB8", light: "#5C5347" },
    glyph: "stead",
  },
  {
    id: "croft",
    name: "croft",
    what: "Sandboxes and virtual machines for agent work",
    group: "fence",
    job: "Keeps work fenced in",
    pain: "My agents have free rein on my machine.",
    blurb: "Sandboxes the operating system enforces, and virtual machines for code you don't trust.",
    status: "design",
    color: { dark: "#7FC4B3", light: "#2A7466" },
    glyph: "croft",
  },
  {
    id: "gateway",
    name: "gateway",
    what: "A proxy that holds credentials so agents don't",
    group: "fence",
    job: "Holds the keys",
    pain: "My agents hold my API keys.",
    blurb: "Agents never hold your credentials. Inside mill today; its own name is still to come.",
    status: "design",
    color: { dark: "#6CC6D9", light: "#1F6E80" },
    glyph: "gateway",
  },
  {
    id: "knowledge",
    name: "knowledge",
    what: "A memory agents can ask, with sources",
    group: "deliver",
    job: "Remembers what was learned",
    pain: "Every session starts from scratch.",
    blurb: "Agents stop starting every job from scratch. Its own name is still to come.",
    status: "design",
    color: { dark: "#D58BD0", light: "#8A3A86" },
    glyph: "knowledge",
  },
  {
    id: "fallow",
    name: "fallow",
    what: "Disk cleanup for what agents leave behind",
    group: "maintain",
    job: "Takes back the disk",
    pain: "My disk is full of what agents left behind.",
    blurb: "Takes back the disk your agents leave behind.",
    measured: "One workstation: 41 GB.",
    status: "design",
    color: { dark: "#B5C47A", light: "#5E6B22" },
    glyph: "fallow",
  },
];

/** The hub and every project, by id. */
export const ALL: readonly Project[] = [STEADING, ...PROJECTS];

export function projectById(id: string): Project {
  const project = ALL.find((candidate) => candidate.id === id);
  if (!project) {
    throw new Error(`"${id}" is not a Steading project. Known projects: ${ALL.map((p) => p.id).join(", ")}`);
  }
  return project;
}
