import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fileFor } from "../../scripts/serve.ts";

const root = mkdtempSync(join(tmpdir(), "serve-"));
mkdirSync(join(root, "guide"));
writeFileSync(join(root, "index.html"), "home");
writeFileSync(join(root, "guide", "index.html"), "guide");
writeFileSync(join(root, "guide.md"), "# guide");

describe("fileFor", () => {
  it("answers a folder with its index.html", () => {
    expect(fileFor(root, "/")).toBe(join(root, "index.html"));
    expect(fileFor(root, "/guide/")).toBe(join(root, "guide", "index.html"));
  });

  it("answers a file with itself", () => {
    expect(fileFor(root, "/guide.md")).toBe(join(root, "guide.md"));
  });

  it("has nothing for a folder without its slash, a missing page, or a path that climbs out", () => {
    expect(fileFor(root, "/guide")).toBeUndefined();
    expect(fileFor(root, "/nope/")).toBeUndefined();
    expect(fileFor(root, "/../etc/passwd")).toBeUndefined();
    expect(fileFor(root, "/%2e%2e/%2e%2e/etc/passwd")).toBeUndefined();
  });
});
