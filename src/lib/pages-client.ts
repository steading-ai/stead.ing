/**
 * Brings the page you are on into view in the navigation, when the navigation
 * is long enough to scroll on its own. Without it the navigation opens at its
 * top.
 */
export function start(root: Document) {
  const pages = root.querySelector<HTMLElement>("nav.pages");
  const current = pages?.querySelector<HTMLElement>('a[aria-current="page"]');
  if (!pages || !current || pages.scrollHeight <= pages.clientHeight) return;
  const from = current.getBoundingClientRect().top - pages.getBoundingClientRect().top;
  pages.scrollTop += from - (pages.clientHeight - current.offsetHeight) / 2;
}
