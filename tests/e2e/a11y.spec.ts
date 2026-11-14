import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SITES } from "../../playwright.config.ts";

const at = (site: keyof typeof SITES, path: string) => `http://127.0.0.1:${SITES[site].port}${path}`;

const PAGES = {
  "the hub": at("steading", "/"),
  "a hub page": at("steading", "/how-we-work/"),
  "a project's front page": at("fixture", "/"),
  "a project's README": at("fixture", "/docs/"),
  "a page with code and a table": at("fixture", "/docs/reference/"),
  "a page in a folder": at("fixture", "/docs/guide/first/"),
  "a folder's generated page": at("fixture", "/docs/adrs/"),
  "a long page with its contents": at("fixture", "/docs/guide/long/"),
  "a page in a folded section": at("fixture", "/docs/adrs/001-first-decision/"),
  "not found": at("steading", "/404.html"),
};

const WCAG_22_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } };

for (const colorScheme of ["light", "dark"] as const) {
  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${colorScheme} mode, ${device}`, () => {
      test.use({ colorScheme, viewport });

      for (const [name, url] of Object.entries(PAGES)) {
        test(`${name} has no WCAG 2.2 AA violations`, async ({ page }) => {
          await page.goto(url);
          const { violations } = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
          expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target.join(" ")) }))).toEqual([]);
        });

        test(`${name} has no violations with the Projects menu open`, async ({ page }) => {
          await page.goto(url);
          await page.locator("[data-menu] summary").click();
          const { violations } = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
          expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target.join(" ")) }))).toEqual([]);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        });

        test(`${name} doesn't scroll sideways`, async ({ page }) => {
          await page.goto(url);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        });
      }
    });
  }
}
