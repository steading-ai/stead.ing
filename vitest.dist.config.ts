import { defineConfig } from "vitest/config";

// Checks over finished builds; run after `pnpm build:all`.
export default defineConfig({ test: { include: ["tests/dist/**/*.test.ts"] } });
