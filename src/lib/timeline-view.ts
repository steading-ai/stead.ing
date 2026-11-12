/**
 * Draws a stretch of the endless day as SVG. The same code draws the still
 * picture at build time and the moving one in the browser, so a visitor
 * without JavaScript sees one frame of exactly what the others see moving.
 *
 * Everything is placed by absolute time: an event at hour 80 is drawn at
 * 80 × pxPerHour. Whoever shows the drawing slides it so that "now" sits
 * where they want it.
 */
import { backlog, clock, dayName, type LaneId, type Story, type TimelineEvent } from "./timeline.ts";

export interface View {
  /** How wide an hour is. A day view uses about 110; a week view about 7. */
  pxPerHour: number;
  /** Draw skift's lane as the size of the backlog over time, instead of as clips. */
  backlog: boolean;
  /** Join the events of one story with lines. */
  threads: boolean;
  /** How many hours pass each second. */
  speed: number;
}

/** Width of the column of lane names, and of the gap right of "now". */
export const LABELS = 96;
export const MARGIN = 14;
const RULER = 20;
/** The backlog size that reaches the top of skift's lane. */
const BACKLOG_TOP = 40;
const ROW = 9;
/** About how wide a letter of the person's words is, for cutting them to fit. */
const LETTER = 6.4;
const STACK = 3;

interface Lane {
  id: LaneId;
  top: number;
  height: number;
}

export function lanes(view: View): { lanes: Lane[]; height: number } {
  const heights: [LaneId, number][] = [
    ["you", 26],
    ["thicket", 17],
    ["skift", view.backlog ? 48 : 17],
    ["mill", STACK * ROW + 5],
    ["croft", STACK * ROW + 5],
    ["almanac", 17],
    ["knowledge", 17],
  ];
  let top = RULER;
  const placed = heights.map(([id, height]) => {
    const lane = { id, top, height };
    top += height;
    return lane;
  });
  return { lanes: placed, height: top + 4 };
}

/**
 * Gives overlapping clips in a lane a row each, and remembers what it gave,
 * so a clip never changes rows as the picture is redrawn.
 */
export class Packer {
  #rows = new Map<string, number>();
  #taken = new Map<LaneId, [number, number][][]>();

  row(event: TimelineEvent): number {
    const known = this.#rows.get(event.id);
    if (known !== undefined) return known;
    const rows = this.#taken.get(event.lane) ?? Array.from({ length: STACK }, () => []);
    this.#taken.set(event.lane, rows);
    const free = rows.findIndex((spans) => spans.every(([start, end]) => event.end + 0.04 <= start || event.start >= end + 0.04));
    const row = free === -1 ? 0 : free;
    (rows[row] as [number, number][]).push([event.start, event.end]);
    this.#rows.set(event.id, row);
    return row;
  }
}

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (value: number) => value.toFixed(1);

export interface Frame {
  /** Markup for the part that slides. */
  svg: string;
  events: Map<string, TimelineEvent>;
  stories: Map<number, Story>;
}

/** Lanes for projects that are designed but not built: their clips are drawn hollow. */
export type Hollow = ReadonlySet<LaneId>;

export function frame(view: View, stories: readonly Story[], from: number, to: number, packer: Packer, hollow: Hollow): Frame {
  const { lanes: placed, height } = lanes(view);
  const lane = (id: LaneId) => placed.find((candidate) => candidate.id === id) as Lane;
  const x = (time: number) => time * view.pxPerHour;
  const wide = view.pxPerHour >= 40;
  const parts: string[] = [];
  const visible = stories.flatMap((story) => story.events).filter((event) => event.end >= from && event.start <= to);
  const events = new Map(visible.map((event) => [event.id, event]));

  // Nights, so the eye can tell when nobody is watching.
  for (let day = Math.floor(from / 24) - 1; day <= Math.floor(to / 24); day++) {
    parts.push(`<rect class="night" x="${n(x(day * 24 + 23))}" y="${RULER}" width="${n(x(8.5))}" height="${height - RULER - 4}"/>`);
  }

  // The ruler: hours on a day view, days on a week view.
  for (let hour = Math.floor(from); hour <= Math.ceil(to); hour++) {
    const midnight = ((hour % 24) + 24) % 24 === 0;
    if (wide) {
      parts.push(`<line class="tick" x1="${n(x(hour))}" x2="${n(x(hour))}" y1="${RULER - 5}" y2="${RULER}"/>`);
      parts.push(`<text class="hour" x="${n(x(hour) + 4)}" y="${RULER - 7}">${clock(hour)}</text>`);
    } else if (midnight) {
      parts.push(`<line class="tick" x1="${n(x(hour))}" x2="${n(x(hour))}" y1="2" y2="${height - 4}"/>`);
      parts.push(`<text class="hour" x="${n(x(hour) + 5)}" y="${RULER - 7}">${dayName(hour)}</text>`);
    }
  }

  if (view.threads) {
    for (const story of stories) {
      const steps = story.events.filter((event) => events.has(event.id)).sort((a, b) => a.start - b.start);
      for (let index = 1; index < steps.length; index++) {
        const [before, after] = [steps[index - 1] as TimelineEvent, steps[index] as TimelineEvent];
        if (before.lane === after.lane) continue;
        const [a, b] = [lane(before.lane), lane(after.lane)];
        parts.push(
          `<line class="thread" data-story="${story.id}" x1="${n(x(before.start))}" y1="${n(a.top + a.height / 2)}" x2="${n(x(after.start))}" y2="${n(b.top + b.height / 2)}"/>`,
        );
      }
    }
  }

  if (view.backlog) {
    const skift = lane("skift");
    const floor = skift.top + skift.height - 3;
    // A square-root scale: a quiet backlog still shows its steps, and a large one still fits.
    const y = (size: number) => floor - Math.sqrt(Math.min(size, BACKLOG_TOP) / BACKLOG_TOP) * (skift.height - 8);
    const points = backlog(stories).filter((point) => point.time >= from - 2 && point.time <= to);
    if (points.length > 1) {
      const first = points[0] as { time: number; size: number };
      let path = `M${n(x(first.time))} ${n(y(first.size))}`;
      for (const point of points.slice(1)) path += `H${n(x(point.time))}V${n(y(point.size))}`;
      const last = points.at(-1) as { time: number; size: number };
      parts.push(`<path class="backlog-area p-skift" d="${path}H${n(x(to))}V${floor}H${n(x(first.time))}Z"/>`);
      parts.push(`<path class="backlog-line p-skift" d="${path}H${n(x(Math.max(to, last.time)))}"/>`);
    }
  }

  // The person's words are printed beside each mark, cut short where the next mark would run into them.
  const moments = visible.filter((event) => event.lane === "you").sort((a, b) => a.start - b.start);
  const room = new Map(moments.map((event, index) => [event.id, ((moments[index + 1]?.start ?? Number.POSITIVE_INFINITY) - event.start) * view.pxPerHour - 26]));

  for (const event of visible) {
    const at = lane(event.lane);
    const attributes = `data-id="${event.id}" data-story="${event.story}"`;
    if (event.lane === "you") {
      parts.push(`<circle class="moment" ${attributes} cx="${n(x(event.start))}" cy="${at.top + at.height / 2}" r="5.5"/>`);
      const letters = Math.floor((room.get(event.id) ?? 0) / LETTER);
      if (wide && event.label && letters >= 6) {
        const said = event.label.length > letters ? `${event.label.slice(0, letters - 1).trimEnd()}…` : event.label;
        parts.push(`<text class="said" ${attributes} x="${n(x(event.start) + 11)}" y="${at.top + at.height / 2 + 4}">${escape(said)}</text>`);
      }
      continue;
    }
    if (event.lane === "skift" && view.backlog && !event.asks) continue;
    const stacked = event.lane === "mill" || event.lane === "croft";
    // Over the backlog graph, a waiting question is a thin bar along the top of the lane.
    const thin = event.lane === "skift" && view.backlog;
    const top = stacked ? at.top + 3 + packer.row(event) * ROW : at.top + 4;
    const tall = stacked ? ROW - 2 : thin ? 6 : at.height - 8;
    const width = Math.max((event.end - event.start) * view.pxPerHour, wide ? 4 : 1.5);
    const kind = event.asks ? "wait" : hollow.has(event.lane) ? "hollow" : "";
    parts.push(
      `<rect class="clip p-${event.lane} ${kind}" ${attributes} x="${n(x(event.start))}" y="${n(top)}" width="${n(width)}" height="${tall}" rx="${wide ? 2 : 0}"/>`,
    );
  }

  return { svg: parts.join(""), events, stories: new Map(stories.map((story) => [story.id, story])) };
}

/** The events whose end falls in a stretch of time: what the counters tick on. */
export function finishedBetween(stories: readonly Story[], after: number, upTo: number): TimelineEvent[] {
  return stories.flatMap((story) => story.events).filter((event) => event.end > after && event.end <= upTo);
}

/** The event that most recently began: what the line under the picture reports. */
export function latest(stories: readonly Story[], now: number): TimelineEvent | undefined {
  let found: TimelineEvent | undefined;
  for (const event of stories.flatMap((story) => story.events)) {
    // Several things can start at once; the later one listed is the more telling (the run, not its workspace).
    if (event.start <= now && (!found || event.start >= found.start)) found = event;
  }
  return found;
}
