/**
 * The product map as a small machine: where each project sits, the lines
 * between them, and one turn of the loop as a schedule of what travels along
 * which line and which project is busy when. Everything is in the drawing's
 * own units and in seconds; the components turn it into SVG and CSS.
 */

export type NodeId = "thicket" | "almanac" | "skift" | "mill" | "croft" | "gateway" | "knowledge" | "merged";
/** Who sends along a line: a project, the person, or the world outside. */
export type Sender = Exclude<NodeId, "merged"> | "you" | "world";

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

const BOX = { w: 156, h: 72 };
const at = (id: NodeId, role: string, cx: number, cy: number, w = BOX.w): FlowNode => ({ id, role, x: cx - w / 2, y: cy - BOX.h / 2, w, h: BOX.h });

/** The top row is the line a task travels; the bottom row is what sits under and beside it. */
const LINE = 60;
const UNDER = 232;

/** The projects on the map, laid out so that work reads left to right. */
export const NODES: FlowNode[] = [
  at("thicket", "you talk it through", 196, LINE),
  at("skift", "holds the plan", 400, LINE),
  at("mill", "does the work", 604, LINE),
  at("merged", "in your repository", 836, LINE, 160),
  at("almanac", "watches the world", 196, UNDER),
  at("knowledge", "remembers", 400, UNDER),
  at("croft", "fences it in", 604, UNDER),
  at("gateway", "holds the keys", 808, UNDER),
];

export const SIZE = { width: 980, height: 280 };
/** Where work comes from: the person, and whatever happens outside. */
export const YOU = { x: 14, y: LINE };
export const WORLD = { x: 14, y: UNDER };
/** Where the gateway's requests go. */
export const OUTSIDE = { x: 914, y: UNDER };

/** What travels along a line. The legend names each. */
export type Kind = "said" | "event" | "task" | "run" | "question" | "request" | "change";

/** Each kind's name, and a drawing of it: the inside of a 16 by 16 SVG, in lines. */
export const KINDS: Record<Kind, { label: string; icon: string }> = {
  said: { label: "Message", icon: '<path d="M2.5 3.5h11v7.5H7.2l-3 2.5v-2.5H2.5z"/>' },
  event: { label: "Event", icon: '<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/>' },
  task: { label: "Task", icon: '<path d="M2.5 2.5h11v11h-11z"/><path d="M5 8.2l2.1 2.1L11 6.2"/>' },
  run: { label: "Run", icon: '<path d="M5 3.2v9.6L13 8z"/>' },
  question: { label: "Question", icon: '<path d="M5.7 6a2.3 2.3 0 1 1 3.6 1.9c-.8.6-1.3 1-1.3 2"/><circle class="dot" cx="8" cy="12.7" r="0.9"/>' },
  request: { label: "Request", icon: '<path d="M6.5 3H3v10h10V9.5"/><path d="M9 2.5h4.5V7M13.5 2.5l-6 6"/>' },
  change: { label: "Change", icon: '<path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9.2 3.5 6.8 12.5"/>' },
};

export interface Edge {
  /** The line as an SVG path of `M`, `H` and `V` only, drawn in the direction work moves. */
  d: string;
  from: Sender;
  kind: Kind;
  /** Whether the line carries a mark saying what travels along it. */
  badge: boolean;
  /** Not running yet: one end is still in design, or the link itself is still to be built. */
  planned: boolean;
}

const edge = (d: string, from: Sender, kind: Kind, options: { badge?: boolean; planned?: boolean } = {}): Edge => ({ d, from, kind, badge: options.badge ?? true, planned: options.planned ?? false });

export const EDGES = {
  you: edge("M22 60H118", "you", "said"),
  world: edge("M22 232H118", "world", "event"),
  thicketSkift: edge("M274 50H322", "thicket", "task"),
  almanacSkift: edge("M274 232H298V74H322", "almanac", "task", { planned: true }),
  skiftMill: edge("M478 60H526", "skift", "task"),
  skiftKnowledge: edge("M400 96V196", "skift", "event", { planned: true }),
  millCroft: edge("M582 96V196", "mill", "run", { planned: true }),
  croftMill: edge("M626 196V96", "croft", "change", { planned: true }),
  croftKnowledge: edge("M526 220H478", "croft", "question", { planned: true }),
  knowledgeCroft: edge("M478 244H526", "knowledge", "question", { badge: false, planned: true }),
  croftGateway: edge("M682 232H730", "croft", "request", { planned: true }),
  gatewayOut: edge("M886 232H908", "gateway", "request", { badge: false, planned: true }),
  millMerged: edge("M682 60H756", "mill", "change"),
} as const satisfies Record<string, Edge>;

export type EdgeId = keyof typeof EDGES;

type Point = readonly [number, number];

/** The corners of a line, from its path. */
export function points(d: string): Point[] {
  const found: Point[] = [];
  let x = 0;
  let y = 0;
  for (const [, command, numbers] of d.matchAll(/([MHV])([\d.\s]+)/g)) {
    const values = (numbers ?? "").trim().split(/\s+/).map(Number);
    if (command === "M") [x = 0, y = 0] = values;
    if (command === "H") [x = 0] = values;
    if (command === "V") [y = 0] = values;
    found.push([x, y]);
  }
  return found;
}

/** The point halfway along a line, where its mark sits. */
export function middle(d: string): Point {
  const corners = points(d);
  const lengths = corners.slice(1).map(([x, y], index) => Math.abs(x - (corners[index]?.[0] ?? x)) + Math.abs(y - (corners[index]?.[1] ?? y)));
  let left = lengths.reduce((sum, length) => sum + length, 0) / 2;
  for (const [index, length] of lengths.entries()) {
    const [fromX, fromY] = corners[index] ?? [0, 0];
    const [toX, toY] = corners[index + 1] ?? [0, 0];
    if (left <= length) return [fromX + ((toX - fromX) * left) / length, fromY + ((toY - fromY) * left) / length];
    left -= length;
  }
  return corners[0] ?? [0, 0];
}

/** An arrowhead at the end of a line, pointing the way it runs, as an SVG path. */
export function head(d: string, size = 5): string {
  const corners = points(d);
  const [x, y] = corners.at(-1) ?? [0, 0];
  const [fromX, fromY] = corners.at(-2) ?? [0, 0];
  const along = [Math.sign(x - fromX), Math.sign(y - fromY)] as const;
  const across = [along[1], along[0]] as const;
  const back = [x - along[0] * size, y - along[1] * size] as const;
  return `M${x} ${y}L${back[0] + across[0] * size * 0.7} ${back[1] + across[1] * size * 0.7}L${back[0] - across[0] * size * 0.7} ${back[1] - across[1] * size * 0.7}Z`;
}

export interface Burst {
  edge: EdgeId;
  /** When the first mark leaves, and how long the trip takes. */
  from: number;
  takes: number;
  count: number;
  /** Seconds between one mark and the next. */
  gap: number;
}

/** One turn of the loop. */
export const BURSTS: Burst[] = [
  { edge: "you", from: 0, takes: 0.6, count: 1, gap: 0 },
  { edge: "thicketSkift", from: 0.7, takes: 0.9, count: 4, gap: 0.16 },
  { edge: "skiftMill", from: 2.5, takes: 0.9, count: 3, gap: 0.18 },
  { edge: "millCroft", from: 3.9, takes: 0.7, count: 3, gap: 0.18 },
  { edge: "world", from: 3.9, takes: 0.5, count: 1, gap: 0 },
  { edge: "almanacSkift", from: 4.6, takes: 1.4, count: 1, gap: 0 },
  { edge: "croftKnowledge", from: 5.0, takes: 0.6, count: 2, gap: 0.2 },
  { edge: "knowledgeCroft", from: 5.9, takes: 0.6, count: 2, gap: 0.2 },
  { edge: "croftMill", from: 7.0, takes: 0.7, count: 3, gap: 0.18 },
  { edge: "millMerged", from: 8.1, takes: 1.3, count: 3, gap: 0.2 },
  { edge: "skiftKnowledge", from: 9.7, takes: 1.2, count: 3, gap: 0.2 },
];

/** Requests leave the croft through the gateway all the time, whatever else is going on. */
export const STREAMS: { edge: EdgeId; every: number; takes: number; count: number }[] = [
  { edge: "croftGateway", every: 1.5, takes: 0.9, count: 3 },
  { edge: "gatewayOut", every: 1.5, takes: 0.5, count: 3 },
];

/** When each project is busy, as stretches of the turn. */
export const BUSY: Partial<Record<NodeId, [number, number][]>> = {
  thicket: [[0.4, 1.9]],
  skift: [
    [1.5, 3.5],
    [5.8, 6.6],
    [9.4, 10.6],
  ],
  mill: [[3.3, 9.5]],
  croft: [[4.5, 7.8]],
  knowledge: [
    [5.5, 6.6],
    [10.6, 12],
  ],
  merged: [[9.3, 11.2]],
  almanac: [[4.2, 5.4]],
};

/** One turn of the loop in words: each step is lit while the map shows it. */
export const STEPS: { from: number; to: number; title: string; text: string; by: Sender }[] = [
  { from: 0, to: 2.5, title: "Ask", text: "You talk an idea through, and thicket files it in skift as tasks.", by: "thicket" },
  { from: 2.5, to: 3.9, title: "Plan", text: "Skift knows what is ready, and hands it to mill.", by: "skift" },
  { from: 3.9, to: 7, title: "Build", text: "Mill works each task in a croft. Requests leave through the gateway.", by: "mill" },
  { from: 7, to: 9.7, title: "Ship", text: "Each step closes on proof a program checked, and mill merges the change.", by: "you" },
  { from: 9.7, to: 12, title: "Learn", text: "Knowledge indexes what was filed and finished, for the next task.", by: "knowledge" },
];

const share = (seconds: number) => `${((seconds / CYCLE) * 100).toFixed(2)}%`;

/** Keyframes that carry a mark along its line during one stretch of the turn, and hide it otherwise. */
export function travel(name: string, from: number, takes: number): string {
  const start = Math.max(from, 0.01);
  const end = Math.min(from + takes, CYCLE - 0.02);
  return `@keyframes ${name}{0%,${share(start - 0.01)}{offset-distance:0%;opacity:0}${share(start)}{offset-distance:0%;opacity:1}${share(end)}{offset-distance:100%;opacity:1}${share(end + 0.01)},100%{offset-distance:100%;opacity:0}}`;
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
