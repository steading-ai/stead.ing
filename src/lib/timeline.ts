/**
 * A day on a steading, as it is meant to run, generated without end.
 *
 * Time is hours since an arbitrary midnight. Work arrives as stories: one
 * cause (a direction from the person, an advisory, a crash report) and
 * everything the projects do about it. Each hour's stories are generated from
 * that hour's number alone, so any stretch of time can be drawn at any moment
 * and always comes out the same.
 *
 * Nothing here is a record of real work. It is a picture of the design.
 */
import { mulberry32 } from "./field.ts";

export type LaneId = "you" | "thicket" | "skift" | "mill" | "croft" | "almanac" | "knowledge";

export interface TimelineEvent {
  id: string;
  story: number;
  lane: LaneId;
  start: number;
  end: number;
  /** What happened, in a sentence, for the detail shown on hover. */
  text: string;
  /** Tasks added to the backlog (positive) or finished (negative). */
  nodes?: number;
  merged?: boolean;
  deployed?: boolean;
  /** A question that only the person can answer. */
  asks?: boolean;
  /** For the person's lane: their words, short enough to print beside their mark. */
  label?: string;
}

export interface Story {
  id: number;
  /** What set it off. */
  title: string;
  events: TimelineEvent[];
}

/** The longest a story may run, in hours. Drawing a moment needs every story begun this long before it. */
export const LOOKBACK = 16;

const TASKS = [
  "Rate-limit the webhook handler",
  "Add idempotency keys to payment retries",
  "Paginate the audit log",
  "Cache the permissions lookup",
  "Move session storage off the primary",
  "Show cost per run on the run page",
  "Validate webhook signatures",
  "Add an export for large reports",
  "Retry uploads with backoff",
  "Split the nightly job into shards",
  "Index the events table by tenant",
  "Add a dry-run flag to the importer",
  "Stream search results",
  "Drain workers at step boundaries",
  "Trim oversized review findings",
  "Rotate the signing key without downtime",
  "Add a health endpoint to the worker",
  "Record who approved each deploy",
  "Make the migration resumable",
  "Throttle password reset emails",
] as const;

const DIRECTIONS = [
  "Ship rate limiting on the public API.",
  "Make exports work for the largest customers.",
  "Get checkout under 300 ms.",
  "Add single sign-on for teams.",
  "Cut the nightly job's runtime in half.",
  "Make every deploy reversible.",
  "Give support a read-only view of an account.",
] as const;

const PRIORITIES = [
  "Billing matters more than search this week.",
  "Hold the redesign until the migration lands.",
  "Security fixes go ahead of everything.",
] as const;

const QUESTIONS = [
  ["Which region for the new bucket?", "Frankfurt."],
  ["Free plan: 100 or 1000 requests a minute?", "1000."],
  ["Keep the old endpoint for a release?", "Yes, one release."],
  ["Which license for the docs?", "CC BY 4.0."],
] as const;

const ADVISORIES = ["tar", "undici", "openssl", "the YAML parser", "the image library", "the HTTP router"] as const;
const UPDATES = ["the type definitions", "the test runner", "the linter", "the build tool", "the ORM"] as const;
/** What came in, and the task it became. */
const FEEDBACK = [
  ["3 people report exports failing on large files", "Fix exports failing on large files"],
  ["5 people ask for dark mode in the dashboard", "Add dark mode to the dashboard"],
  ["2 people cannot reset a password from the app", "Fix password reset from the app"],
  ["4 people report slow search on long queries", "Speed up search on long queries"],
] as const;
const EXCEPTIONS = [
  ["TimeoutError in checkout, 40 times in ten minutes", "Fix the checkout timeout"],
  ["a null in the invoice renderer, new since the last deploy", "Handle the missing value in the invoice renderer"],
  ["rate limit errors from the mail provider", "Back off when the mail provider rate-limits"],
  ["a slow query on the events table", "Index the slow events query"],
] as const;

type Draft = Omit<TimelineEvent, "id" | "story">;

interface Context {
  /** When the story starts. */
  at: number;
  random: () => number;
  /** The next task number. */
  ref: () => number;
}

const pick = <T,>(random: () => number, items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
const hourOfDay = (time: number) => ((time % 24) + 24) % 24;
const awake = (time: number) => hourOfDay(time) >= 7.5 && hourOfDay(time) < 22.5;

/** The next moment the person is likely to see a question: soon if they are up, in the morning if not. */
function nextAnswer(time: number, random: () => number): number {
  if (awake(time)) return time + 0.3 + random() * 0.7;
  const untilMorning = (7.5 - hourOfDay(time) + 24) % 24;
  return time + untilMorning + random() * 0.6;
}

/** One task taken from ready to merged: a workspace comes up, mill works in it, the workspace is gone. */
function run(start: number, length: number, ref: number, title: string, options: { deploy?: boolean; revise?: boolean; vm?: boolean } = {}): Draft[] {
  const where = options.vm ? "its own virtual machine, because the code is a stranger's" : "a container with no network";
  return [
    { lane: "croft", start, end: start + length, text: `Workspace for #${ref}: ${where}. Torn down when the run ended, credentials gone with it.` },
    {
      lane: "mill",
      start,
      end: start + length,
      text: `#${ref} ${title}: planned, built, reviewed${options.revise ? ", sent back once, revised" : ""}, merged${options.deploy ? ", deployed" : ""}.`,
      nodes: -1,
      merged: true,
      ...(options.deploy ? { deployed: true } : {}),
    },
  ];
}

/** The person says what they want. Thicket turns it into tasks, and mill works them as each becomes ready. */
function direction({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const said = pick(random, DIRECTIONS);
  const count = 7 + Math.floor(random() * 7);
  const events: Draft[] = [
    { lane: "you", start: at, end: at, text: `You: "${said}"`, label: said },
    { lane: "thicket", start: at + 0.05, end: at + 0.3, text: `Talked "${said}" through and broke it into ${count} tasks, each with what it depends on.` },
    { lane: "skift", start: at + 0.3, end: at + 0.4, text: `${count} tasks filed. 2 are ready now; the rest wait on them.`, nodes: count },
  ];
  // Tasks become ready as the ones before them merge, so the work spreads over the hours that follow.
  let clock = at + 0.45;
  for (let index = 0; index < count; index++) {
    const length = 0.35 + random() * 0.7;
    const start = clock + (index % 2 === 0 ? 0 : random() * 0.3);
    events.push(...run(start, length, ref(), pick(random, TASKS), { deploy: index === count - 1, revise: random() < 0.25 }));
    if (index % 2 === 1) clock = start + length + 0.1 + random() * 1.1;
  }
  const done = Math.max(...events.map((event) => event.end));
  events.push({ lane: "knowledge", start: done + 0.05, end: done + 0.2, text: `Wrote up what changed for "${said}" and proposed edits to 2 runbooks.` });
  return { title: `You: "${said}"`, events };
}

/** The person changes what matters most. Nothing is built; the order of everything else changes. */
function reprioritize({ at, random }: Context): { title: string; events: Draft[] } {
  const said = pick(random, PRIORITIES);
  const moved = 8 + Math.floor(random() * 12);
  return {
    title: `You: "${said}"`,
    events: [
      { lane: "you", start: at, end: at, text: `You: "${said}"`, label: said },
      { lane: "thicket", start: at + 0.05, end: at + 0.25, text: `Restructured the backlog: ${moved} tasks moved, priorities reset to match.` },
      { lane: "skift", start: at + 0.25, end: at + 0.32, text: `${moved} tasks reordered. What is ready next changed for every agent at once.` },
    ],
  };
}

/** Mill finds the spec unclear, checks it against the code, and files what was missing. Sometimes it has to ask. */
function discovery({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const task = pick(random, TASKS);
  const first = ref();
  const events: Draft[] = [
    { lane: "mill", start: at, end: at + 0.25, text: `Planning "${task}": the spec left two cases open. Checked them against the code and wrote down what it found.` },
    { lane: "skift", start: at + 0.25, end: at + 0.32, text: `Mill filed 2 tasks for the cases the spec left open, blocking the one that needs them.`, nodes: 2 },
  ];
  let start = at + 0.4;
  if (random() < 0.3) {
    const [question, answer] = pick(random, QUESTIONS);
    const answered = nextAnswer(start, random);
    events.push(
      { lane: "skift", start, end: answered, text: `A task only a person can do: "${question}" No agent can claim it.`, asks: true },
      { lane: "you", start: answered, end: answered, text: `You answered "${question}": "${answer}"`, label: answer },
    );
    start = answered + 0.1;
  }
  events.push(...run(start, 0.3 + random() * 0.5, first, `${task}: the first open case`));
  events.push(...run(start + 0.2 + random() * 0.6, 0.3 + random() * 0.5, ref(), `${task}: the second open case`, { revise: random() < 0.3 }));
  return { title: `Mill found the spec for "${task}" incomplete`, events };
}

function advisory({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const what = pick(random, ADVISORIES);
  const number = ref();
  return {
    title: `A security advisory for ${what}`,
    events: [
      { lane: "almanac", start: at, end: at + 0.12, text: `A security advisory for ${what}. Checked which repositories ship it: 3 do.` },
      { lane: "skift", start: at + 0.12, end: at + 0.18, text: `Filed #${number} at the top priority: update ${what} past the advisory.`, nodes: 1 },
      ...run(at + 0.2, 0.3 + random() * 0.4, number, `Update ${what} past the advisory`, { deploy: true }),
      { lane: "knowledge", start: at + 1, end: at + 1.12, text: `Recorded the advisory for ${what}, what was exposed, and the fix.` },
    ],
  };
}

function repair({ at, random }: Context): { title: string; events: Draft[] } {
  const what = pick(random, UPDATES);
  return {
    title: `An update to ${what} broke a build`,
    events: [
      { lane: "almanac", start: at, end: at + 0.3, text: `An update to ${what} broke a build. Read the failure, fixed one line in a sandbox, pushed it; checks passed and the update merged.`, merged: true },
    ],
  };
}

function feedback({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const [what, task] = pick(random, FEEDBACK);
  const number = ref();
  return {
    title: `Feedback: ${what}`,
    events: [
      { lane: "almanac", start: at, end: at + 0.15, text: `Feedback came in: ${what}. Grouped the reports and found the release they started with.` },
      { lane: "skift", start: at + 0.15, end: at + 0.22, text: `Filed #${number} with the reports attached.`, nodes: 1 },
      ...run(at + 0.4 + random() * 1.5, 0.4 + random() * 0.6, number, task, { deploy: true, revise: random() < 0.3 }),
    ],
  };
}

function exception({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const [what, task] = pick(random, EXCEPTIONS);
  const number = ref();
  const length = 0.3 + random() * 0.5;
  return {
    title: `In production: ${what}`,
    events: [
      { lane: "almanac", start: at, end: at + 0.1, text: `In production: ${what}. Matched it to yesterday's deploy.` },
      { lane: "skift", start: at + 0.1, end: at + 0.16, text: `Filed #${number} with the stack trace and the deploy it started with.`, nodes: 1 },
      ...run(at + 0.2, length, number, task, { deploy: true }),
      { lane: "knowledge", start: at + 0.3 + length, end: at + 0.45 + length, text: `Added the incident to the service's notes: the cause, the fix, how to spot it again.` },
    ],
  };
}

function fork({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const number = ref();
  return {
    title: "A pull request from a stranger",
    events: [
      { lane: "almanac", start: at, end: at + 0.08, text: `A pull request arrived from a fork. Its author has never contributed before.` },
      { lane: "skift", start: at + 0.08, end: at + 0.14, text: `Filed #${number}: review the outside pull request.`, nodes: 1 },
      ...run(at + 0.2, 0.3 + random() * 0.3, number, "Review and test an outside pull request", { vm: true }),
    ],
  };
}

function question({ at, random, ref }: Context): { title: string; events: Draft[] } {
  const number = ref();
  return {
    title: "Two documents disagree",
    events: [
      { lane: "knowledge", start: at, end: at + 0.15, text: `Two documents disagree on the retry limit. Said so in its answers, and asked which is right.` },
      { lane: "skift", start: at + 0.15, end: at + 0.21, text: `Filed #${number}: settle the retry limit and fix the document that is wrong.`, nodes: 1 },
      ...run(at + 0.5 + random(), 0.25 + random() * 0.3, number, "Settle the retry limit in the docs"),
    ],
  };
}

function reindex({ at }: Context): { title: string; events: Draft[] } {
  return {
    title: "The nightly reindex",
    events: [{ lane: "knowledge", start: at, end: at + 0.7, text: `Reindexed everything filed, finished, and learned today. Marked 3 notes stale and proposed an edit to each.` }],
  };
}

/** Thicket keeps the backlog in order on its own: duplicates merged, oversized tasks split. */
function groom({ at, random }: Context): { title: string; events: Draft[] } {
  const merged = 2 + Math.floor(random() * 3);
  return {
    title: "Thicket tidied the backlog",
    events: [
      { lane: "thicket", start: at, end: at + 0.2, text: `Tidied the backlog: merged ${merged} duplicate tasks and split one that was too big to review in one go.` },
      { lane: "skift", start: at + 0.2, end: at + 0.26, text: `${merged} duplicates closed, 1 task split in two. What is ready next is unchanged.` },
    ],
  };
}

/** Knowledge follows what the other projects do, as it happens. */
function index({ at, random }: Context): { title: string; events: Draft[] } {
  const files = 6 + Math.floor(random() * 30);
  return {
    title: "Knowledge kept up",
    events: [{ lane: "knowledge", start: at, end: at + 0.18, text: `Indexed ${files} changed files and the pull requests that changed them, so the next answer cites today's code.` }],
  };
}

function warm({ at }: Context): { title: string; events: Draft[] } {
  return {
    title: "Caches rebuilt",
    events: [{ lane: "croft", start: at, end: at + 0.35, text: `Rebuilt the toolchain caches after an update, so the next workspace starts in seconds.` }],
  };
}

/** How likely each kind of story is to start in a given hour. The person only speaks while they are up. */
function odds(hour: number): [(context: Context) => { title: string; events: Draft[] }, number][] {
  // A story can start anywhere in its hour, so the person must be up for all of it.
  const up = awake(hour) && awake(hour + 0.9);
  return [
    [direction, up ? 0.2 : 0],
    [reprioritize, up ? 0.05 : 0],
    [discovery, 0.4],
    [advisory, 0.12],
    [repair, 0.45],
    [feedback, up ? 0.22 : 0.05],
    [exception, 0.15],
    [fork, 0.12],
    [question, 0.08],
    [reindex, hourOfDay(hour) === 3 ? 1 : 0],
    [warm, 0.08],
    [groom, 0.22],
    [index, 0.55],
  ];
}

/** The stories that begin in one hour. The same hour always gives the same stories. */
export function storiesStartingIn(hour: number): Story[] {
  const random = mulberry32(hour * 7919 + 13);
  let next = 2000 + hour * 9;
  const stories: Story[] = [];
  odds(hour).forEach(([make, chance], kind) => {
    if (random() >= chance) return;
    const id = hour * 100 + kind;
    const made = make({ at: hour + random() * 0.9, random, ref: () => next++ });
    stories.push({
      id,
      title: made.title,
      events: made.events
        .map((event) => ({ ...event, end: Math.min(event.end, hour + LOOKBACK - 1) }))
        .map((event, index) => ({ ...event, id: `${id}-${index}`, story: id })),
    });
  });
  return stories;
}

/** Every story that could have an event between two times. */
export function storiesBetween(from: number, to: number): Story[] {
  const stories: Story[] = [];
  for (let hour = Math.floor(from) - LOOKBACK; hour <= Math.floor(to); hour++) stories.push(...storiesStartingIn(hour));
  return stories;
}

/** Tasks nobody has started that were filed before the picture begins. */
export const BACKLOG_BASE = 6;

/** The backlog's size over time, as the points where it changes. */
export function backlog(stories: readonly Story[]): { time: number; size: number }[] {
  const changes = stories
    .flatMap((story) => story.events)
    .filter((event) => event.nodes)
    .map((event) => ({ time: (event.nodes as number) > 0 ? event.start : event.end, delta: event.nodes as number }))
    .sort((a, b) => a.time - b.time);
  let size = BACKLOG_BASE;
  return changes.map(({ time, delta }) => ({ time, size: (size += delta) }));
}

export const clock = (time: number) => {
  const minutes = Math.floor(hourOfDay(time) * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const dayName = (time: number) => DAYS[((Math.floor(time / 24) % 7) + 7) % 7] as string;
