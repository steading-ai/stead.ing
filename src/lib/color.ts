/**
 * The brand's colors, and the arithmetic that keeps them readable. Loam is the
 * dark theme and Daylight the light one; `src/styles/global.css` carries the
 * same values, and a test holds the two in step.
 */

export const THEMES = {
  light: {
    ground: "#F4EFE6",
    surface: "#FFFCF6",
    ink: "#1C1A17",
    muted: "#6E665B",
    line: "#DDD5C7",
    ember: "#B84A16",
    onEmber: "#FFFCF6",
  },
  dark: {
    ground: "#1A1612",
    surface: "#241F19",
    ink: "#EFE6D2",
    muted: "#A8998A",
    line: "#3A3229",
    ember: "#E8743B",
    onEmber: "#1A1612",
  },
} as const;

export type ThemeName = keyof typeof THEMES;

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a `#RRGGBB` color (WCAG 2.2). */
export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`${hex} is not a #RRGGBB color`);
  const [r, g, b] = match.slice(1).map((pair) => channel(Number.parseInt(pair, 16))) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colors, from 1 to 21 (WCAG 2.2). */
export function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}
