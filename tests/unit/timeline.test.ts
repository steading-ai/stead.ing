import { describe, expect, it } from "vitest";
import { backlog, BACKLOG_BASE, clock, dayName, LOOKBACK, storiesBetween, storiesStartingIn } from "../../src/lib/timeline.ts";
import { finishedBetween, frame, latest, Packer, type View } from "../../src/lib/timeline-view.ts";

const WEEK = storiesBetween(72, 72 + 24 * 7);
const events = WEEK.flatMap((story) => story.events);
const view: View = { pxPerHour: 110, backlog: false, threads: true, speed: 1 / 6 };

describe("the endless day", () => {
  it("gives an hour the same stories every time", () => {
    expect(storiesStartingIn(100)).toEqual(storiesStartingIn(100));
    expect(storiesBetween(90, 100)).toEqual(storiesBetween(90, 100));
  });

  it("starts every story in its own hour and ends it within the lookback", () => {
    for (let hour = 72; hour < 240; hour++) {
      for (const story of storiesStartingIn(hour)) {
        for (const event of story.events) {
          expect(event.start).toBeGreaterThanOrEqual(hour);
          expect(event.end).toBeGreaterThanOrEqual(event.start);
          expect(event.end).toBeLessThan(hour + LOOKBACK);
        }
      }
    }
  });

  it("gives every event an id of its own", () => {
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });

  it("puts every project to work, and the person least of all", () => {
    const count = (lane: string) => events.filter((event) => event.lane === lane).length;
    for (const lane of ["thicket", "skift", "mill", "croft", "almanac", "knowledge"]) expect(count(lane), lane).toBeGreaterThan(count("you"));
    expect(count("you")).toBeGreaterThan(0);
  });

  it("only hears from the person while they are awake", () => {
    for (const event of events.filter((candidate) => candidate.lane === "you")) {
      const hour = event.start % 24;
      expect(hour).toBeGreaterThanOrEqual(7.5);
      expect(hour).toBeLessThan(24);
    }
  });

  it("finishes every task a story files", () => {
    for (const story of WEEK) {
      expect(story.events.reduce((sum, event) => sum + (event.nodes ?? 0), 0), story.title).toBe(0);
    }
  });

  it("never lets the backlog run below what was there to begin with", () => {
    for (const point of backlog(WEEK)) expect(point.size).toBeGreaterThanOrEqual(BACKLOG_BASE);
  });
});

describe("drawing it", () => {
  const drawn = frame(view, WEEK, 100, 110, new Packer(), new Set(["croft"]));

  it("draws only what falls in the stretch asked for", () => {
    for (const event of drawn.events.values()) {
      expect(event.end).toBeGreaterThanOrEqual(100);
      expect(event.start).toBeLessThanOrEqual(110);
    }
    expect(drawn.events.size).toBeGreaterThan(20);
  });

  it("draws designed-but-unbuilt projects hollow, and the rest solid", () => {
    expect(drawn.svg).toMatch(/class="clip p-croft hollow"/);
    expect(drawn.svg).not.toMatch(/class="clip p-mill hollow"/);
  });

  it("escapes what it prints", () => {
    expect(drawn.svg).not.toMatch(/<text[^>]*>[^<]*"[^<]*<\/text>/);
  });

  it("keeps a clip in the row it was first given", () => {
    const packer = new Packer();
    const mill = events.filter((event) => event.lane === "mill");
    const first = mill.map((event) => packer.row(event));
    expect(mill.map((event) => packer.row(event))).toEqual(first);
  });

  it("counts what finishes in a stretch of time exactly once", () => {
    const whole = finishedBetween(WEEK, 100, 110).length;
    expect(finishedBetween(WEEK, 100, 105).length + finishedBetween(WEEK, 105, 110).length).toBe(whole);
  });

  it("reports the event that began most recently", () => {
    const found = latest(WEEK, 105);
    expect(found?.start).toBeLessThanOrEqual(105);
    expect(events.some((event) => event.start <= 105 && event.start > (found?.start ?? 0))).toBe(false);
  });
});

describe("telling the time", () => {
  it("writes hours as a clock and days by name", () => {
    expect(clock(72 + 14.5)).toBe("14:30");
    expect(clock(23.99)).toBe("23:59");
    expect(dayName(0)).toBe("Mon");
    expect(dayName(24 * 8 + 3)).toBe("Tue");
  });
});
