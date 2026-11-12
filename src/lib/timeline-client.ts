/**
 * Makes the still timeline move. It slides the drawing so "now" stays at the
 * right edge, redraws as new hours come into view, counts what finishes, and
 * shows an event's detail when it is pointed at. Without this script the page
 * shows the one frame drawn at build time.
 */
import { clock, type LaneId, storiesBetween, type Story, type TimelineEvent } from "./timeline.ts";
import { finishedBetween, frame, LABELS, lanes, latest, MARGIN, Packer, type View } from "./timeline-view.ts";

const count = (value: number) => value.toLocaleString("en-US");

function run(figure: HTMLElement): void {
  const view = JSON.parse(figure.dataset.view ?? "{}") as View;
  const hollow = new Set((figure.dataset.hollow ?? "").split(" ").filter(Boolean)) as Set<LaneId>;
  const stage = figure.querySelector<HTMLElement>("[data-stage]");
  const svg = figure.querySelector<SVGSVGElement>("svg");
  const scroll = figure.querySelector<SVGGElement>("[data-scroll]");
  const clip = figure.querySelector<SVGRectElement>("[data-clip] rect");
  const nowLine = figure.querySelector<SVGLineElement>("[data-now-line]");
  const tip = figure.querySelector<HTMLElement>("[data-tip]");
  const line = figure.querySelector<HTMLElement>("[data-latest]");
  const button = figure.querySelector<HTMLButtonElement>("[data-pause]");
  if (!stage || !svg || !scroll || !clip || !nowLine || !tip || !line || !button) return;

  const { height } = lanes(view);
  const packer = new Packer();
  // How far ahead of "now" to draw, so new work is ready before it is needed.
  const ahead = Math.max(2, view.speed * 8);
  // Start at the visitor's own time of day: at night they see the night shift.
  const local = new Date();
  let now = 72 + local.getHours() + local.getMinutes() / 60;
  let width = 0;
  let nowX = 0;
  let drawnTo = Number.NEGATIVE_INFINITY;
  let stories: Story[] = [];
  let events = new Map<string, TimelineEvent>();
  let titles = new Map<number, Story>();
  let paused = view.autoplay === false || matchMedia("(prefers-reduced-motion: reduce)").matches;
  let live: number | undefined;
  let pointing = false;
  let pinned = false;

  const counters = [...figure.querySelectorAll<HTMLElement>("[data-count]")].map((element) => ({
    element,
    key: element.dataset.count as "merged" | "deployed",
    value: Number(element.dataset.value),
  }));

  function measure(): void {
    width = stage!.clientWidth;
    nowX = width - MARGIN;
    svg!.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg!.setAttribute("height", String(height));
    clip!.setAttribute("width", String(Math.max(nowX - LABELS, 0)));
    nowLine!.setAttribute("x1", String(nowX));
    nowLine!.setAttribute("x2", String(nowX));
    for (const rule of figure.querySelectorAll("[data-rule]")) rule.setAttribute("x2", String(width));
  }

  function draw(): void {
    const from = now - (nowX - LABELS) / view.pxPerHour - 1;
    const to = now + ahead;
    stories = storiesBetween(from, to);
    const drawn = frame(view, stories, from, to, packer, hollow);
    scroll!.innerHTML = drawn.svg;
    events = drawn.events;
    titles = drawn.stories;
    drawnTo = to;
    // A redraw replaces every element, so the story happening now has to be marked again.
    live = undefined;
    report();
  }

  function place(): void {
    scroll!.setAttribute("transform", `translate(${(nowX - now * view.pxPerHour).toFixed(2)} 0)`);
  }

  function report(): void {
    const event = latest(stories, now);
    if (!event) return;
    line!.textContent = `${clock(event.start)} ${event.lane}: ${event.text}`;
    if (event.story === live) return;
    // Mark the story happening now, so a quiet strip can spend its color there.
    for (const element of scroll!.querySelectorAll(".live")) element.classList.remove("live");
    for (const element of scroll!.querySelectorAll(`[data-story="${event.story}"]`)) element.classList.add("live");
    live = event.story;
  }

  function tick(from: number, to: number): void {
    for (const event of finishedBetween(stories, from, to)) {
      for (const counter of counters) {
        if (event[counter.key]) counter.element.textContent = count(++counter.value);
      }
    }
  }

  function focus(story: number | undefined): void {
    for (const element of scroll!.querySelectorAll(".in-story")) element.classList.remove("in-story");
    svg!.classList.toggle("focused", story !== undefined);
    if (story === undefined) return;
    for (const element of scroll!.querySelectorAll(`[data-story="${story}"]`)) element.classList.add("in-story");
  }

  function show(event: TimelineEvent, pointer: { x: number; y: number }): void {
    const who = document.createElement("div");
    who.className = "who";
    const name = document.createElement("b");
    name.textContent = hollow.has(event.lane) ? `${event.lane} · in design` : event.lane;
    const when = document.createElement("span");
    when.textContent = event.end - event.start > 0.02 ? `${clock(event.start)} to ${clock(event.end)}` : clock(event.start);
    who.append(name, when);
    const what = document.createElement("p");
    what.textContent = event.text;
    tip!.replaceChildren(who, what);
    const cause = titles.get(event.story)?.title;
    if (cause && !event.text.includes(cause.replace(/^You: /, ""))) {
      const because = document.createElement("p");
      because.className = "cause";
      because.textContent = `Set off by: ${cause}`;
      tip!.append(because);
    }
    tip!.hidden = false;
    const box = stage!.getBoundingClientRect();
    const x = pointer.x - box.left;
    const left = x + tip!.offsetWidth + 16 > box.width ? x - tip!.offsetWidth - 12 : x + 14;
    tip!.style.left = `${Math.max(4, left)}px`;
    tip!.style.top = `${pointer.y - box.top + 16}px`;
    focus(event.story);
  }

  function hide(): void {
    tip!.hidden = true;
    pinned = false;
    focus(undefined);
  }

  const under = (target: EventTarget | null) =>
    target instanceof Element ? events.get(target.closest<SVGElement>("[data-id]")?.dataset.id ?? "") : undefined;

  // A mouse: the picture holds still while it is pointed at, and whatever is under the pointer explains itself.
  stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") pointing = true;
  });
  stage.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "mouse") return;
    pointing = false;
    hide();
  });
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const found = under(event.target);
    if (found) show(found, { x: event.clientX, y: event.clientY });
    else hide();
  });
  // A finger: tap an event to read it, and tap anywhere else to let the picture go on.
  stage.addEventListener("click", (event) => {
    const found = under(event.target);
    if (!found) return hide();
    show(found, { x: event.clientX, y: event.clientY });
    pinned = true;
  });
  document.addEventListener("click", (event) => {
    if (pinned && event.target instanceof Node && !stage.contains(event.target)) hide();
  });

  button.hidden = false;
  const label = () => {
    button.textContent = paused ? "Play" : "Pause";
    button.setAttribute("aria-pressed", String(paused));
  };
  label();
  button.addEventListener("click", () => {
    paused = !paused;
    label();
  });

  new ResizeObserver(() => {
    measure();
    draw();
    place();
  }).observe(stage);
  measure();
  draw();
  place();
  report();

  let last = performance.now();
  let reported = 0;
  function step(time: number): void {
    const seconds = Math.min((time - last) / 1000, 0.1);
    last = time;
    if (!paused && !pointing && !pinned) {
      const before = now;
      now += seconds * view.speed;
      if (now > drawnTo - ahead / 2) draw();
      tick(before, now);
      place();
      if (time - reported > 600) {
        report();
        reported = time;
      }
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function start(root: ParentNode): void {
  for (const figure of root.querySelectorAll<HTMLElement>("[data-timeline]")) run(figure);
}
