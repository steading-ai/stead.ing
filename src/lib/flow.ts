/**
 * The product map as a small machine: where each project sits, the lines
 * between them, and one turn of the loop as a schedule of what travels along
 * which line and which project is busy when. Everything is in the drawing's
 * own units and in seconds; the component turns it into SVG and CSS.
 */

export type NodeId = "you" | "thicket" | "almanac" | "skift" | "mill" | "croft" | "gateway" | "knowledge" | "merged" | "console" | "stead" | "fallow";

export interface FlowNode {
  id: NodeId;
  /** A few words on what it does in the loop. */
  role: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One turn of the loop, in seconds. */
export const CYCLE = 12;

const BOX = { w: 128, h: 40 };
const at = (id: NodeId, role: string, cx: number, cy: number, w = BOX.w, h = BOX.h): FlowNode => ({ id, role, x: cx - w / 2, y: cy - h / 2, w, h });

/** The projects a task passes through, laid out so that work reads left to right. */
export const CORE: FlowNode[] = [
  at("thicket", "you talk it through", 140, 64),
  at("skift", "holds the plan", 350, 64),
  at("mill", "does the work", 560, 64),
  at("merged", "merged, running", 1040, 64, 160),
  at("almanac", "watches the world", 140, 160),
  at("knowledge", "remembers", 350, 160),
  at("croft", "fences it in", 560, 160),
  at("gateway", "holds the keys", 790, 160),
];

/** The projects that sit around the loop, for the map that shows all ten. */
export const AROUND: FlowNode[] = [
  at("stead", "on your Mac", 140, 248),
  at("fallow", "cleans up after", 350, 248),
];
/** How much taller the map is with the row of projects that sit alongside. */
export const AROUND_ROW = 60;

export const SIZE = { width: 1152, height: 212 };
/** Where the person stands: a single light at the left end. */
export const YOU = { x: 24, y: 64 };

/** The lines work travels along, as SVG paths. Each runs in the direction work moves. */
export const EDGES = {
  you: "M34 64H76",
  thicketSkift: "M204 64H286",
  almanacSkift: "M204 160H245V74H286",
  skiftMill: "M414 64H496",
  millCroft: "M545 84V140",
  croftMill: "M575 140V84",
  croftGateway: "M624 160H726",
  gatewayOut: "M854 160H908",
  croftKnowledge: "M496 153H414",
  knowledgeCroft: "M414 167H496",
  millMerged: "M624 64H960",
  mergedKnowledge: "M975 84V200H350V180",
} as const;

export type EdgeId = keyof typeof EDGES;

/** What a moving mark stands for, which decides its shape and color. */
export type Kind = "said" | "task" | "event" | "request" | "question" | "change";

export interface Burst {
  edge: EdgeId;
  kind: Kind;
  /** When the first mark leaves, and how long the trip takes. */
  from: number;
  takes: number;
  count: number;
  /** Seconds between one mark and the next. */
  gap: number;
}

/** One turn of the loop. */
export const BURSTS: Burst[] = [
  { edge: "you", kind: "said", from: 0, takes: 0.6, count: 1, gap: 0 },
  { edge: "thicketSkift", kind: "task", from: 0.7, takes: 0.9, count: 4, gap: 0.16 },
  { edge: "skiftMill", kind: "task", from: 2.5, takes: 0.9, count: 3, gap: 0.18 },
  { edge: "millCroft", kind: "task", from: 3.9, takes: 0.7, count: 3, gap: 0.18 },
  { edge: "almanacSkift", kind: "event", from: 4.4, takes: 1.4, count: 1, gap: 0 },
  { edge: "croftKnowledge", kind: "question", from: 5.0, takes: 0.6, count: 2, gap: 0.2 },
  { edge: "knowledgeCroft", kind: "question", from: 5.9, takes: 0.6, count: 2, gap: 0.2 },
  { edge: "croftMill", kind: "task", from: 7.0, takes: 0.7, count: 3, gap: 0.18 },
  { edge: "millMerged", kind: "task", from: 8.1, takes: 1.3, count: 3, gap: 0.2 },
  { edge: "mergedKnowledge", kind: "change", from: 9.7, takes: 1.6, count: 2, gap: 0.25 },
];

/** Requests leave the croft through the gateway all the time, whatever else is going on. */
export const STREAMS: { edge: EdgeId; kind: Kind; every: number; takes: number; count: number }[] = [
  { edge: "croftGateway", kind: "request", every: 1.5, takes: 0.9, count: 3 },
  { edge: "gatewayOut", kind: "request", every: 1.5, takes: 0.5, count: 3 },
];

/** When each project is busy, as stretches of the turn. */
export const BUSY: Partial<Record<NodeId, [number, number][]>> = {
  thicket: [[0.4, 1.9]],
  skift: [
    [1.5, 3.5],
    [5.6, 6.5],
  ],
  mill: [[3.3, 9.5]],
  croft: [[4.5, 7.8]],
  knowledge: [
    [5.5, 6.6],
    [11, 12],
  ],
  merged: [[9.3, 11.2]],
  almanac: [[4.2, 5.2]],
};

/** What is happening, said in a sentence, for the map that narrates itself. */
export const STEPS: { from: number; to: number; text: string }[] = [
  { from: 0, to: 2.5, text: "You talk an idea through, and thicket files it in skift as tasks." },
  { from: 2.5, to: 3.9, text: "Skift hands mill whatever is ready." },
  { from: 3.9, to: 7, text: "Mill works each task inside a croft. The croft asks knowledge what it needs, and every outside request goes through the gateway." },
  { from: 7, to: 9.7, text: "The work comes back checked, and mill merges it." },
  { from: 9.7, to: 12, text: "Knowledge indexes what changed, ready for the next task." },
];

const share = (seconds: number) => `${((seconds / CYCLE) * 100).toFixed(2)}%`;

/** Keyframes that carry a mark along its line during one stretch of the turn, and hide it otherwise. */
export function travel(name: string, from: number, takes: number): string {
  const start = Math.max(from, 0.01);
  const end = Math.min(from + takes, CYCLE - 0.02);
  return `@keyframes ${name}{0%,${share(start - 0.01)}{offset-distance:0%;opacity:0}${share(start)}{offset-distance:0%;opacity:1}${share(end)}{offset-distance:100%;opacity:1}${share(end + 0.01)},100%{offset-distance:100%;opacity:0}}`;
}

/**
 * Keyframes that put a sentence on the page for one stretch of the turn. It is
 * shown and hidden outright, not faded: half-faded text cannot be read.
 */
export function shownDuring(name: string, from: number, to: number): string {
  const start = Math.max(from, 0.01);
  const end = Math.min(to, CYCLE - 0.01);
  return `@keyframes ${name}{0%,${share(start - 0.01)}{visibility:hidden}${share(start)},${share(end)}{visibility:visible}${share(end + 0.005)},100%{visibility:hidden}}`;
}

/** Keyframes that show something during the given stretches of the turn. */
export function during(name: string, spans: readonly [number, number][], fade = 0.25): string {
  const stops = spans
    .map(([from, to]) => {
      const start = Math.max(from, fade);
      const end = Math.min(to, CYCLE - fade);
      return `${share(start - fade)}{opacity:0}${share(start)},${share(end)}{opacity:1}${share(end + fade)}{opacity:0}`;
    })
    .join("");
  return `@keyframes ${name}{0%{opacity:0}${stops}100%{opacity:0}}`;
}
