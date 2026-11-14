/**
 * Marks, in a page's list of contents, the section the reader is in. Without
 * it the list is still a list of links.
 *
 * A list is a `[data-toc]` holding links to headings on the page. A page may
 * hold the list twice, beside it and folded above it; both are marked.
 */
import { headingAt } from "./toc.ts";

/** How far down the window a heading has to come before its section counts as the one being read. */
const LINE_PX = 120;

export function start(root: Document) {
  const lists = [...root.querySelectorAll<HTMLElement>("[data-toc]")].map((list) => [...list.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]);
  const first = lists[0];
  if (!first || first.length === 0) return;
  const headings = first.map((link) => root.getElementById(decodeURIComponent(link.hash.slice(1))));
  let marked = -2;
  let waiting = false;
  const mark = () => {
    waiting = false;
    const tops = headings.map((heading) => heading?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY);
    const atFoot = Math.ceil(scrollY + innerHeight) >= root.documentElement.scrollHeight;
    const current = headingAt(tops, LINE_PX, atFoot && scrollY > 0);
    if (current === marked) return;
    marked = current;
    for (const links of lists) {
      links.forEach((link, index) => {
        if (index === current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }
  };
  const later = () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(mark);
  };
  addEventListener("scroll", later, { passive: true });
  addEventListener("resize", later, { passive: true });
  mark();
}
