/**
 * Small drawings for the story of work that keeps coming back to one person.
 * Each is the inside of a 24 by 24 SVG, drawn in lines so it takes the color
 * and weight of the text beside it. `ray` marks the lines drawn in ember.
 */
export const ICONS = {
  /** An idea. */
  bulb:
    '<path d="M12 7.5a4.6 4.6 0 0 0-3 8c.5.5.8 1.2.8 1.9h4.4c0-.7.3-1.4.8-1.9a4.6 4.6 0 0 0-3-8zM9.8 19.7h4.4M10.6 22h2.8"/>' +
    '<path class="ray" d="M12 1.6v2.7M5.3 4.2l1.7 2M18.7 4.2l-1.7 2M2.4 9.7l2.5.8M21.6 9.7l-2.5.8"/>',
  /** Setting it going. */
  play: '<path d="M7.5 4.5v15L20 12z"/>',
  /** Keeping several agents pointed the right way. */
  talk:
    '<path d="M3.5 3.5h9.5A1.5 1.5 0 0 1 14.5 5v5.5A1.5 1.5 0 0 1 13 12H8.2l-3 2.6V12H3.5A1.5 1.5 0 0 1 2 10.5V5a1.5 1.5 0 0 1 1.5-1.5z"/>' +
    '<path d="M17.5 8.5h3A1.5 1.5 0 0 1 22 10v5.5a1.5 1.5 0 0 1-1.5 1.5h-1.3v2.6l-3-2.6h-4.7A1.5 1.5 0 0 1 10 15.5v-.7"/>',
  /** Checking what came back. */
  shield: '<path d="M12 2.7 4.5 5.4v6.1c0 4.5 3 7.9 7.5 9.8 4.5-1.9 7.5-5.3 7.5-9.8V5.4z"/><path d="M8.6 11.9l2.4 2.4 4.4-4.7"/>',
  /** What is waiting when you come back. */
  tangle:
    '<ellipse cx="12" cy="12" rx="9.6" ry="5.4" transform="rotate(18 12 12)"/><ellipse cx="12" cy="12" rx="9.6" ry="5.4" transform="rotate(64 12 12)"/>' +
    '<ellipse cx="12" cy="12" rx="9.6" ry="5.4" transform="rotate(112 12 12)"/><ellipse cx="12" cy="12" rx="9.6" ry="5.4" transform="rotate(158 12 12)"/>' +
    '<circle cx="12" cy="12" r="2.6"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** Everything that has to go through you, step by step. */
export const STEPS: { icon: IconName; text: string }[] = [
  { icon: "bulb", text: "Have an idea." },
  { icon: "play", text: "Start work." },
  { icon: "talk", text: "Coordinate agents." },
  { icon: "shield", text: "Review results." },
  { icon: "tangle", text: "Come back." },
];
