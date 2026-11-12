/**
 * How a site's Markdown becomes pages. Authors link between files the way
 * they would on GitHub (`../guide/first.md`); the HTML pages need those links
 * pointed at page addresses instead.
 */
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineHastPlugin } from "satteri";

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i;

/** The page address for a Markdown file's path inside the content folder: `guide/first.md` → `/guide/first/`. */
export function pagePath(file: string): string {
  const id = file
    .split(sep)
    .join("/")
    .replace(/\.md$/, "")
    .replace(/(^|\/)index$/, "");
  return id === "" ? "/" : `/${id}/`;
}

/** The address of a page's Markdown twin: `/guide/first/` → `/guide/first.md`, `/` → `/index.md`. */
export function markdownPath(page: string): string {
  return page === "/" ? "/index.md" : `${page.replace(/\/$/, "")}.md`;
}

/**
 * Point a relative link to a Markdown file at that file's page. Anything else
 * (web addresses, anchors, links that leave the content folder) is returned
 * unchanged.
 */
export function rewriteLink(href: string, fromFile: string, root: string): string {
  if (EXTERNAL.test(href)) return href;
  const [target = "", hash] = href.split("#", 2);
  if (!target.endsWith(".md")) return href;
  const inside = relative(root, resolve(dirname(fromFile), target));
  if (inside.startsWith("..")) return href;
  return pagePath(inside) + (hash ? `#${hash}` : "");
}

/** Sätteri plugin applying `rewriteLink` to every link in a Markdown file under `root`. */
export function rewriteDocLinks({ root }: { root: string }) {
  return defineHastPlugin({
    name: "rewrite-doc-links",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== "string" || !ctx.fileURL) return;
        const from = fileURLToPath(ctx.fileURL);
        if (relative(root, from).startsWith("..")) return;
        const rewritten = rewriteLink(href, from, root);
        if (rewritten !== href) ctx.setProperty(node, "href", rewritten);
      },
    },
  });
}

const LEADING_H1 = /^\s*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/;

/** A page's first-line `# Title`, if it opens with one. */
export function leadingTitle(body: string): string | undefined {
  return LEADING_H1.exec(body)?.[1];
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Render the little Markdown that `site.yaml` strings may use: `code`,
 * **bold**, and [links](https://example.com). Everything else is escaped.
 */
export function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<a href="$2">$1</a>');
}
