/**
 * How a site's Markdown becomes pages. Authors link between files the way
 * they would on GitHub (`../guide/first.md`); the HTML pages need those links
 * pointed at page addresses instead.
 */
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineHastPlugin } from "satteri";

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i;

/** The address of a page's Markdown twin: `/guide/first/` → `/guide/first.md`, `/` → `/index.md`. */
export function markdownPath(page: string): string {
  return page === "/" ? "/index.md" : `${page.replace(/\/$/, "")}.md`;
}

/** What a link in a Markdown file may point at, besides the wider web. */
export interface LinkTargets {
  /** The content folder. */
  root: string;
  /** Each page's address, by its file's path from the content folder. */
  pages: ReadonlyMap<string, string>;
  /** Each folder of pages' address, by its path from the content folder. */
  folders: ReadonlyMap<string, string>;
  /** Each picture the site serves, by its file's path from the content folder. */
  images?: ReadonlyMap<string, string> | undefined;
  /** Where the project's other files can be read on the web, if anywhere. */
  source?: { blob: string; tree: string } | undefined;
}

/**
 * Point a relative link at what it means on the site. A link to a Markdown
 * file that is a page goes to that page; a link to a folder of pages goes to
 * the folder's page; a link to anything else in the project (its source, a
 * workflow, a config file) goes to that file on the web. Web addresses and
 * anchors are returned unchanged.
 */
export function resolveLink(href: string, fromFile: string, targets: LinkTargets): string {
  if (EXTERNAL.test(href)) return href;
  const [target = "", hash] = href.split("#", 2);
  const inside = relative(targets.root, resolve(dirname(fromFile), target)).split(sep).join("/");
  if (inside.startsWith("..")) return href;
  const anchor = hash ? `#${hash}` : "";
  const page = targets.pages.get(inside) ?? targets.folders.get(inside.replace(/\/$/, ""));
  if (page) return page + anchor;
  if (!targets.source) return href;
  return `${target.endsWith("/") ? targets.source.tree : targets.source.blob}/${inside}${anchor}`;
}

/** Sätteri plugin applying `resolveLink` to every link in a Markdown file under the content folder. */
export function rewriteDocLinks(targets: LinkTargets) {
  return defineHastPlugin({
    name: "rewrite-doc-links",
    element: {
      filter: ["a"],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== "string" || !ctx.fileURL) return;
        const from = fileURLToPath(ctx.fileURL);
        if (relative(targets.root, from).startsWith("..")) return;
        const rewritten = resolveLink(href, from, targets);
        if (rewritten !== href) ctx.setProperty(node, "href", rewritten);
      },
    },
  });
}

/** Point a picture's relative address at where the site serves it. Anything else is returned unchanged. */
export function resolveImage(src: string, fromFile: string, targets: LinkTargets): string {
  if (EXTERNAL.test(src)) return src;
  const inside = relative(targets.root, resolve(dirname(fromFile), src)).split(sep).join("/");
  return targets.images?.get(inside) ?? src;
}

const SOURCES = /\b(src|srcset)="([^"]+)"/g;

/**
 * Sätteri plugin applying `resolveImage` to every picture in a Markdown file
 * under the content folder, whether it was written as Markdown or as HTML.
 */
export function rewriteDocImages(targets: LinkTargets) {
  const fileOf = (url: URL | undefined) => {
    if (!url) return undefined;
    const from = fileURLToPath(url);
    return relative(targets.root, from).startsWith("..") ? undefined : from;
  };
  return defineHastPlugin({
    name: "rewrite-doc-images",
    element: {
      filter: ["img"],
      visit(node, ctx) {
        const src = node.properties?.src;
        const from = fileOf(ctx.fileURL);
        if (typeof src !== "string" || !from) return;
        const rewritten = resolveImage(src, from, targets);
        if (rewritten !== src) ctx.setProperty(node, "src", rewritten);
      },
    },
    raw(node, ctx) {
      const from = fileOf(ctx.fileURL);
      if (!from) return;
      const rewritten = node.value.replace(SOURCES, (_, name: string, value: string) => `${name}="${resolveImage(value, from, targets)}"`);
      if (rewritten !== node.value) ctx.replaceNode(node, { type: "raw", value: rewritten });
    },
  });
}

/**
 * Sätteri plugin giving every table a frame it can scroll sideways in, so a
 * wide table never widens the page. The frame takes keyboard focus, since
 * scrolling it is otherwise out of reach without a pointer.
 */
export function scrollWideTables() {
  return defineHastPlugin({
    name: "scroll-wide-tables",
    element: {
      filter: ["table"],
      visit(node, ctx) {
        ctx.wrapNode(node, {
          type: "element",
          tagName: "div",
          properties: { className: ["table-scroll"], tabIndex: 0, role: "group", ariaLabel: "Table" },
          children: [],
        });
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
 * **bold**, *emphasis*, and [links](https://example.com). Everything else is
 * escaped.
 */
export function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<a href="$2">$1</a>');
}
