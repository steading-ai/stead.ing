/**
 * Serve built sites the way a static host does: a folder answers with its
 * index.html, a missing address with the site's 404.html, and nothing else.
 * The browser tests and local review both use it, so neither depends on a
 * preview server's own rules.
 *
 *   node scripts/serve.ts dist/steading:4410 dist/skift:4411
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

/** The file a request path maps to, or undefined when the site has nothing there. */
export function fileFor(root: string, pathname: string): string | undefined {
  const path = normalize(decodeURIComponent(pathname));
  if (path.includes("..")) return undefined;
  const target = join(root, path);
  if (!existsSync(target)) return undefined;
  if (!statSync(target).isDirectory()) return target;
  const index = join(target, "index.html");
  return path.endsWith("/") && existsSync(index) ? index : undefined;
}

export function serve(root: string, port: number, host = "127.0.0.1") {
  return createServer((request, response) => {
    const { pathname } = new URL(request.url ?? "/", `http://${host}`);
    const found = fileFor(root, pathname);
    const file = found ?? join(root, "404.html");
    if (!existsSync(file)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found\n");
      return;
    }
    response.writeHead(found ? 200 : 404, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  }).listen(port, host);
}

if (import.meta.main) {
  const host = process.env.HOST ?? "127.0.0.1";
  for (const argument of process.argv.slice(2)) {
    const [dir = "", port = ""] = argument.split(":");
    const root = resolve(dir);
    if (!existsSync(join(root, "index.html"))) throw new Error(`${root} has no index.html. Build it first: pnpm build:all`);
    serve(root, Number(port), host);
    console.log(`${dir} → http://${host}:${port}/`);
  }
}
