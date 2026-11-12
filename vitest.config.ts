import { defineConfig } from "vitest/config";

// Unit tests target plain modules, so they run in Node without Astro.
export default defineConfig({ test: { include: ["tests/unit/**/*.test.ts"] } });
