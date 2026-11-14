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
  /** What kind of thing it is, in a word or two: "Work graph". Set for the projects the hub's hero and map show. */
  kind?: string;
  group: Group;
  /** The problem it answers, in the words of someone who has it. Visitors scan for these. */
  pain: string;
  /** One sentence on what it does about that. */
  blurb: string;
  /** For a project the hub offers as a first piece: the need it answers, said to the reader, and what it does about it. */
  start?: { need: string; does: string };
  /** The hub's closer look, for a project on its map: the problem at length, how the project answers it, and where it stands today. */
  tour?: { problem: string; approach: readonly [string, string, string, string]; today: string };
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
  job: "You and a thousand agents.",
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
    kind: "Work graph",
    what: "A task graph agents and people share",
    group: "deliver",
    job: "Holds the plan",
    pain: "My agents step on each other, and nobody knows what's ready.",
    blurb: "One plan for every agent, on every machine. It always knows what's ready.",
    status: "running",
    color: { dark: "#7FB2E5", light: "#2E62A3" },
    glyph: "skift",
    start: { need: "Your agents need a shared plan.", does: "Keep work, dependencies, and readiness in one place." },
    tour: {
      problem: "Project trackers were built for people and treat an agent as a bot account. They can't answer the one question an orchestrator needs answered: what is ready to work on right now? A tracker kept in a repository can, but it ties the plan to one repository and one checkout.",
      approach: [
        "Work is a graph. A task is ready once what it waits on is done.",
        "Agents and people file, split, and finish work the same way.",
        "A claim expires unless it is renewed, so a crash can't hold work.",
        "Work only a person can do is assigned to one, and waits.",
      ],
      today: "A working service, command line, and MCP server. Its own backlog is held in skift.",
    },
    site: "https://skift.stead.ing/",
    repo: "https://github.com/steading-ai/skift",
  },
  {
    id: "mill",
    name: "mill",
    kind: "Software factory",
    what: "A runner that delivers tasks as merged changes",
    group: "deliver",
    job: "Does the work",
    pain: "I babysit every task until it's merged.",
    blurb: "Takes a ready task to a merged, running change, with proof at every step.",
    status: "running",
    color: { dark: "#E2B84F", light: "#8A6410" },
    glyph: "mill",
    start: { need: "You want work to ship itself.", does: "Take ready tasks through building, review, and delivery." },
    tour: {
      problem: "Nothing takes a ready task to a merged change without a person starting it, scoping it, and babysitting it. Guardrails written as prose ask the model to police itself: steps get skipped, and nothing records which ones ran. The backlog grows faster than it drains.",
      approach: [
        "Claims the next ready task from skift, and keeps no queue of its own.",
        "A step closes only on a fact mill checked outside the session.",
        "The reviewer is a separate session that cannot write.",
        "Every step, attempt, and cost is on record. A crash resumes.",
      ],
      today: "Delivers work on its own repository. The sandbox's host setup is not packaged yet.",
    },
    site: "https://mill.stead.ing/",
    repo: "https://github.com/steading-ai/mill",
  },
  {
    id: "almanac",
    name: "almanac",
    kind: "Dependency repair",
    what: "Automatic repair for broken dependency updates",
    group: "maintain",
    job: "Keeps things maintained",
    pain: "Dependency updates pile up faster than I merge them.",
    blurb: "Repairs broken dependency updates for tens of cents.",
    status: "early",
    color: { dark: "#E79AAE", light: "#A63D5F" },
    glyph: "almanac",
    start: { need: "Your dependency updates keep breaking.", does: "Repair the updates that break your build, and push the fix." },
    tour: {
      problem: "Dependency updates pile up faster than anyone merges them: on one account, 97 of 119 open pull requests. Automerge clears the healthy ones and does nothing for the broken ones. Starting an agent for every event turns a burst of webhooks into a burst of spending.",
      approach: [
        "Code does everything code can. A model is called last.",
        "The repair agent works with no network and no credentials.",
        "Only checks written as plain code let a patch through.",
        "It never merges. It pushes the fix to the pull request.",
      ],
      today: "Repairs Renovate pull requests on its author's repositories. Filing work in skift is planned.",
    },
    site: "https://almanac.stead.ing/",
    repo: "https://github.com/steading-ai/almanac",
  },
  {
    id: "thicket",
    name: "thicket",
    kind: "Agent fleet",
    what: "Agents you reach from Slack or a phone call",
    group: "reach",
    job: "Agents you can talk to",
    pain: "I want to hand an idea to an agent from my phone.",
    blurb: "Agents on the systems you run, reachable from Slack or a phone call.",
    status: "early",
    color: { dark: "#B9A2EC", light: "#6A4BB0" },
    glyph: "thicket",
    tour: {
      problem: "Standing work, like patching, monitoring, and an inbox, happens by hand or in a session you have to sit in front of. And an agent that patches a server as root needs different privileges from one that reads your email. A prompt can't enforce that. A unix account can.",
      approach: [
        "Each agent is one unix account on one host.",
        "The same agent answers from Slack, a phone call, or Claude Code.",
        "Agents that read untrusted text can't reach agents that hold root.",
        "Talk an idea through, and the agent files it in skift.",
      ],
      today: "One operator runs it, with four agents on a home server. There is no installer yet.",
    },
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
    kind: "Sandboxes",
    what: "Sandboxes and virtual machines for agent work",
    group: "fence",
    job: "Keeps work fenced in",
    pain: "My agents have free rein on my machine.",
    blurb: "Sandboxes the operating system enforces, and virtual machines for code you don't trust.",
    status: "design",
    color: { dark: "#7FC4B3", light: "#2A7466" },
    glyph: "croft",
    tour: {
      problem: "Agent runs and CI jobs both run other people's code in a box: one machine for each piece of work, fast the second time, with one way out and no credential that outlives the job. Today that box lives inside mill, with a single fence. Nothing on the host can safely run a stranger's pull request.",
      approach: [
        "A container for work you trust, a virtual machine for work you don't.",
        "Everything leaves through one proxy on the host.",
        "Credentials die with the machine.",
        "Caches make the second run fast, and flow one way only.",
      ],
      today: "Nothing runs yet. Mill's own sandbox does this job today.",
    },
  },
  {
    id: "gateway",
    name: "gateway",
    kind: "Credential proxy",
    what: "A proxy that holds credentials so agents don't",
    group: "fence",
    job: "Holds the keys",
    pain: "My agents hold my API keys.",
    blurb: "Agents never hold your credentials. Inside mill today; its own name is still to come.",
    status: "design",
    color: { dark: "#6CC6D9", light: "#1F6E80" },
    glyph: "gateway",
    tour: {
      problem: "A session signed in as you can read your long-lived credential: the one secret that outlives every step, where the agent's shell can reach it. An agent that holds a key can leak it, and no sentence in a prompt changes that.",
      approach: [
        "The session holds a short-lived token. The host holds the real key.",
        "The real credential is attached on the way out.",
        "Budgets and model choices are enforced outside the agent.",
        "What each response cost is recorded as it passes.",
      ],
      today: "Inside mill today, for model requests only. Its own name is still to come.",
    },
  },
  {
    id: "knowledge",
    name: "knowledge",
    kind: "Shared memory",
    what: "A memory agents can ask, with sources",
    group: "deliver",
    job: "Remembers what was learned",
    pain: "Every session starts from scratch.",
    blurb: "Agents stop starting every job from scratch. Its own name is still to come.",
    status: "design",
    color: { dark: "#D58BD0", light: "#8A3A86" },
    glyph: "knowledge",
    tour: {
      problem: "Every agent starts each job from scratch. The same context gets explained again, and stale docs get treated as truth.",
      approach: [
        "A short answer, with its sources and how fresh each one is.",
        "It says where its sources disagree.",
        "Each agent sees only what it is allowed to read.",
        "A wrong answer becomes a proposed edit to the doc itself.",
      ],
      today: "A prototype exists and is being rethought. Its own name is still to come.",
    },
  },
  {
    id: "fallow",
    name: "fallow",
    what: "Disk cleanup for what agents leave behind",
    group: "maintain",
    job: "Takes back the disk",
    pain: "My disk is full of what agents left behind.",
    blurb: "Takes back the disk your agents leave behind.",
    status: "design",
    color: { dark: "#B5C47A", light: "#5E6B22" },
    glyph: "fallow",
  },
];

/** The hub and every project, by id. */
export const ALL: readonly Project[] = [STEADING, ...PROJECTS];

/**
 * Where a project can be read about: its own site, or else its closer look on
 * the hub's map. A project with neither has nowhere to lead yet. `hub` is the
 * hub's front page as the caller reaches it: "/" from the hub itself.
 */
export function whereabouts(project: Project, hub: string): string | undefined {
  return project.site ?? (project.tour ? `${hub}#${project.id}` : undefined);
}

export function projectById(id: string): Project {
  const project = ALL.find((candidate) => candidate.id === id);
  if (!project) {
    throw new Error(`"${id}" is not a Steading project. Known projects: ${ALL.map((p) => p.id).join(", ")}`);
  }
  return project;
}
