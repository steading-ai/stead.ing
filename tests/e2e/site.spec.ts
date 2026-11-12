import { expect, test } from "@playwright/test";
import { SITES } from "../../playwright.config.ts";

const hub = `http://127.0.0.1:${SITES.steading.port}`;
const skift = `http://127.0.0.1:${SITES.skift.port}`;
const fixture = `http://127.0.0.1:${SITES.fixture.port}`;

test.describe("the first step", () => {
  test("the prompt can be copied with one button", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${hub}/`);
    await page.getByRole("button", { name: "Copy" }).click();
    await expect(page.getByRole("status")).toHaveText("Copied. Paste it into your agent.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("https://stead.ing/llms.txt");
  });

  test("without JavaScript the prompt is still there to select, and no dead button", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    await expect(page.getByText("Read https://stead.ing/llms.txt")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(0);
    await context.close();
  });
});

test.describe("keyboard", () => {
  test("the first Tab stop skips to the content", async ({ page }) => {
    await page.goto(`${hub}/`);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe("the family", () => {
  test("every site names its own project as the current one", async ({ page }) => {
    await page.goto(`${skift}/`);
    const strip = page.getByRole("navigation", { name: "Steading projects" });
    await expect(strip.getByRole("link", { name: "skift" })).toHaveAttribute("aria-current", "page");
    await expect(strip.getByRole("link", { name: "steading" })).toHaveAttribute("href", "https://stead.ing/");
  });

  test("a project without a site is named but not linked", async ({ page }) => {
    await page.goto(`${hub}/`);
    const strip = page.getByRole("navigation", { name: "Steading projects" });
    await expect(strip.getByText("croft")).toBeVisible();
    await expect(strip.getByRole("link", { name: "croft" })).toHaveCount(0);
  });
});

test.describe("color", () => {
  for (const [colorScheme, expected] of [["light", "#2E62A3"], ["dark", "#7FB2E5"]] as const) {
    test(`a project's site wears its own color in ${colorScheme} mode`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto(`${skift}/`);
      const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
      expect(accent.toUpperCase()).toBe(expected);
      await context.close();
    });
  }

  test("the hub wears ember", async ({ page }) => {
    await page.goto(`${hub}/`);
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
    expect(accent.toUpperCase()).toBe("#B84A16");
  });
});

test.describe("pages", () => {
  test("the navigation marks the page you're on", async ({ page }) => {
    await page.goto(`${fixture}/guide/first/`);
    const nav = page.getByRole("navigation", { name: "Pages" });
    await expect(nav.getByRole("link", { name: "First steps" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Reference" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reference");
  });

  test("the Markdown twin is served as Markdown", async ({ request }) => {
    const response = await request.get(`${fixture}/guide/first.md`);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    expect(await response.text()).toContain("canonical: https://skift.stead.ing/guide/first/");
  });
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`screenshots, ${colorScheme}`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    for (const [name, url] of Object.entries({ hub: `${hub}/`, skift: `${skift}/`, page: `${fixture}/reference/` })) {
      await page.goto(url);
      await page.screenshot({ path: `test-results/screenshots/${name}-${colorScheme}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${hub}/`);
    await page.screenshot({ path: `test-results/screenshots/hub-phone-${colorScheme}.png`, fullPage: true });
    await context.close();
  });
}
