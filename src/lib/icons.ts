/**
 * Small drawings for the story of a day spent babysitting agents. Each is the
 * inside of a 24 by 24 SVG, drawn in lines so it takes the color and weight of
 * the text beside it. `dot` marks the parts that are filled, not outlined.
 */
export const ICONS = {
  /** An idea. */
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.4c.7.7 1 1.6 1 2.6h6c0-1 .3-1.9 1-2.6A6 6 0 0 0 12 3z"/>',
  /** A goal. */
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle class="dot" cx="12" cy="12" r="1.6"/>',
  /** Something else to do while you wait. */
  controller:
    '<path d="M7 8h10a5 5 0 0 1 5 5 3.5 3.5 0 0 1-6.3 2.1L15 14H9l-.7 1.1A3.5 3.5 0 0 1 2 13a5 5 0 0 1 5-5z"/>' +
    '<path d="M7.5 10.2v3M6 11.7h3"/><circle class="dot" cx="15.6" cy="10.8" r="1"/><circle class="dot" cx="17.8" cy="12.8" r="1"/>',
  /** Where was I? */
  question: '<path d="M8.5 9a3.5 3.5 0 1 1 5.2 3c-1 .6-1.7 1.3-1.7 2.5V15"/><circle class="dot" cx="12" cy="18.6" r="1.2"/>',
  /** The vein that stands out on a cartoon forehead. */
  vein: '<path d="M4.5 9.5c3 0 5-2 5-5M14.5 4.5c0 3 2 5 5 5M19.5 14.5c-3 0-5 2-5 5M9.5 19.5c0-3-2-5-5-5"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** The day, step by step. */
export const STEPS: { icon: IconName; text: string }[] = [
  { icon: "bulb", text: "Talk out a problem." },
  { icon: "target", text: "Set a goal." },
  { icon: "controller", text: "Switch windows." },
  { icon: "question", text: "Lose the thread." },
  { icon: "vein", text: "Find out your agent is blocked!" },
];
