/**
 * Placeholder records for the motif mockups on the lab page. The step names
 * are mill's real ones (the mill-feature workflow); the tasks, times and costs
 * are invented, and are to be replaced by a real run before anything ships.
 */
import { mulberry32 } from "./field.ts";

/** Who a line of a run's record belongs to: a project, or the person. */
export type Actor = "you" | "thicket" | "skift" | "mill";

export interface Line {
  time: string;
  actor: Actor;
  /** mill's step name, when the line is a step. */
  step?: string;
  /** What an agent or a person said, in their words. */
  said?: string;
  /** What a program found. */
  fact?: string;
  /** `held`: checked and it stands. `back`: checked, failed, sent back. `asks`: waiting on the person. */
  mark?: "held" | "back" | "asks";
  /** Cost in cents. */
  cents?: number;
}

export const RUN = {
  ref: "#212",
  title: "Rate-limit the webhook handler",
  lines: [
    { time: "22:41", actor: "you", said: "Rate-limit the webhook handler." },
    { time: "22:41", actor: "thicket", fact: "filed 3 tasks" },
    { time: "22:42", actor: "skift", fact: "#212 ready, claimed under a lease" },
    { time: "22:44", actor: "mill", step: "plan", fact: "plan accepted", mark: "held", cents: 6 },
    { time: "22:51", actor: "mill", step: "review-plan", fact: "verdict: approve", mark: "held", cents: 11 },
    { time: "22:51", actor: "mill", step: "plan-approval", fact: "needs you: which limit?", mark: "asks" },
    { time: "07:12", actor: "you", said: "1000.", fact: "answered from your phone" },
    { time: "07:13", actor: "mill", step: "implement", said: "Done. All tests pass.", fact: "exit 1: 1 of 214 tests fails. Sent back.", mark: "back", cents: 41 },
    { time: "07:21", actor: "mill", step: "implement", fact: "214 of 214 tests pass", mark: "held", cents: 19 },
    { time: "07:21", actor: "mill", step: "commit", fact: "8b1d07e on the branch", mark: "held", cents: 2 },
    { time: "07:22", actor: "mill", step: "pr", fact: "pull request opened", mark: "held", cents: 3 },
    { time: "07:29", actor: "mill", step: "review", fact: "verdict: approve", mark: "held", cents: 13 },
    { time: "07:30", actor: "mill", step: "merge", fact: "CI passed, on main", mark: "held" },
  ] satisfies Line[] as Line[],
};

export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** One task on the run sheet: its steps in order, and how it stands. */
export type Square = "held" | "back" | "running" | "asks";

export interface Task {
  ref: string;
  title: string;
  squares: Square[];
  cents: number;
  /** What it is waiting for, when it waits on the person. */
  needs?: string;
}

const feature: Square[] = ["held", "held", "held", "held", "held", "held", "held", "held"];

export const SHEET: Task[] = [
  { ref: "#412", title: "Rate-limit the webhook handler", squares: ["held", "held", "held", "back", "held", "held", "held", "held", "held"], cents: 95 },
  { ref: "#413", title: "Trim review findings over 64 KiB", squares: [...feature, "back", "held", "held", "held"], cents: 192 },
  { ref: "#414", title: "Drain at every step boundary", squares: feature, cents: 71 },
  { ref: "#415", title: "Count a revise verdict as evidence", squares: feature, cents: 64 },
  { ref: "#416", title: "Pick a license for the knowledge base prose", squares: ["held", "held", "asks"], cents: 17, needs: "a decision" },
  { ref: "#417", title: "Show each round's cost on the run page", squares: [...feature, "back", "held", "held"], cents: 138 },
  { ref: "#418", title: "Retry a claim when its lease has expired", squares: feature, cents: 58 },
  { ref: "#419", title: "Mint a token for the package channel", squares: ["asks"], cents: 0, needs: "a credential" },
  { ref: "#420", title: "Fix the flaky socket test", squares: ["held", "held", "held", "held"], cents: 22 },
  { ref: "#421", title: "Renew leases from the MCP server", squares: ["held", "held", "held", "running"], cents: 31 },
];

/** A bar on the day strip: one run, from claim to merge, in hours since midnight. */
export interface Bar {
  lane: "mill" | "almanac" | "thicket";
  start: number;
  end: number;
  merged: boolean;
  /** When the run stopped to wait for the person, if it did. */
  waitedFrom?: number;
}

/** The moments the person acted, with what they did. */
export const MOMENTS = [
  { at: 8.03, label: "said what to build" },
  { at: 12.67, label: "answered: 1000 a minute" },
  { at: 21.67, label: "answered: ISC" },
];

export function day(seed = 9): Bar[] {
  const random = mulberry32(seed);
  const bars: Bar[] = [];
  // Mill works whenever something is ready: steadily, with nobody watching.
  let clock = 0.2;
  while (clock < 23.2) {
    const length = 0.25 + random() * 0.75;
    bars.push({ lane: "mill", start: clock, end: Math.min(clock + length, 23.9), merged: random() > 0.12 });
    clock += length + 0.08 + random() * 0.55;
  }
  // Two runs stopped for an answer, and went on when it came.
  bars.push({ lane: "mill", start: 11.4, end: 13.1, merged: true, waitedFrom: 11.9 });
  bars.push({ lane: "mill", start: 20.2, end: 22.3, merged: true, waitedFrom: 20.6 });
  for (const start of [2.25, 5.5, 14.1, 19.3]) bars.push({ lane: "almanac", start, end: start + 0.2 + random() * 0.2, merged: true });
  bars.push({ lane: "thicket", start: 8.0, end: 8.15, merged: true });
  bars.push({ lane: "thicket", start: 18.4, end: 18.6, merged: true });
  return bars;
}
