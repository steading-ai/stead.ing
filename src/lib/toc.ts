/**
 * A page's own contents: the list of its sections beside it, and which of
 * them the reader is in. Pure functions, so tests need no browser.
 */

export interface Heading {
  /** 2 for `##`, 3 for `###`. */
  depth: number;
  /** The heading's id on the page. */
  slug: string;
  text: string;
}

/** The headings a page lists as its contents: its sections and their subsections, or none when there are too few to need a list. */
export function contents(headings: readonly Heading[]): Heading[] {
  const listed = headings.filter((heading) => heading.depth === 2 || heading.depth === 3);
  return listed.length > 1 ? listed : [];
}

/**
 * Which heading the reader is under: the last one at or above the line they
 * read from, given each heading's distance from the top of the window. -1
 * above the first heading. At the foot of the page it is the last heading,
 * which may be too close to the end ever to reach the line.
 */
export function headingAt(tops: readonly number[], line: number, atFoot = false): number {
  if (atFoot) return tops.length - 1;
  let found = -1;
  tops.forEach((top, index) => {
    if (top <= line) found = index;
  });
  return found;
}
