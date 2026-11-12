import { defineConfig, devices } from "@playwright/test";

/** The sites `pnpm build:all` produces, each served on its own port. */
export const SITES = {
  steading: { dir: "dist/steading", port: 4410 },
  skift: { dir: "dist/skift", port: 4411 },
  fixture: { dir: "dist/fixture", port: 4412 },
} as const;

const targets = Object.values(SITES).map(({ dir, port }) => `${dir}:${port}`);

// Runs against finished builds; run `pnpm build:all` first.
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `node scripts/serve.ts ${targets.join(" ")}`,
    url: `http://127.0.0.1:${SITES.steading.port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
