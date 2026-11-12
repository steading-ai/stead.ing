import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SITES } from "../../playwright.config.ts";

const at = (site: keyof typeof SITES, path: string) => `http://127.0.0.1:${SITES[site].port}${path}`;

const PAGES = {
  "the hub": at("steading", "/"),
  "a hub page": at("steading", "/how-we-work/"),
  "a project's front page": at("skift", "/"),
  "a project's front page with every field": at("fixture", "/"),
  "a page with code and a table": at("fixture", "/reference/"),
  "a page in a folder": at("fixture", "/guide/first/"),
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
          await page.getByText("Projects", { exact: true }).click();
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
