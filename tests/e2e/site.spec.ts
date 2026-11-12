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

test.describe("the Projects menu", () => {
  test("says what every project is, not only its name", async ({ page }) => {
    await page.goto(`${hub}/`);
    await page.getByText("Projects", { exact: true }).click();
    const menu = page.locator("[data-menu]");
    await expect(menu.getByRole("link")).toHaveCount(11);
    await expect(menu.getByRole("link", { name: /skift.*A task graph agents and people share/ })).toHaveAttribute(
      "href",
      "https://skift.stead.ing/",
    );
  });

  test("sends a project without a site to its row on the hub, and says how far along it is", async ({ page }) => {
    await page.goto(`${skift}/`);
    await page.getByText("Projects", { exact: true }).click();
    const croft = page.locator("[data-menu]").getByRole("link", { name: /croft/ });
    await expect(croft).toHaveAttribute("href", "https://stead.ing/#croft");
    await expect(croft).toContainText("In design");
  });

  test("marks the project whose site this is", async ({ page }) => {
    await page.goto(`${skift}/`);
    await page.getByText("Projects", { exact: true }).click();
    await expect(page.locator("[data-menu]").getByRole("link", { name: /skift/ })).toHaveAttribute("aria-current", "page");
  });

  test("opens from the keyboard, and Escape closes it and gives focus back", async ({ page }) => {
    await page.goto(`${hub}/`);
    const summary = page.locator("[data-menu] summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-menu] .panel")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.locator("[data-menu]").getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-menu] .panel")).toBeHidden();
    await expect(summary).toBeFocused();
  });

  test("closes on a click elsewhere", async ({ page }) => {
    await page.goto(`${hub}/`);
    await page.getByText("Projects", { exact: true }).click();
    // The open menu covers the top of the page, so click below it.
    await page.getByRole("contentinfo").click();
    await expect(page.locator("[data-menu] .panel")).toBeHidden();
  });

  test("still opens without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    await page.getByText("Projects", { exact: true }).click();
    await expect(page.locator("[data-menu]").getByRole("link", { name: /mill/ })).toBeVisible();
    await context.close();
  });

  test("the hub's row for a project is where its menu link lands", async ({ page }) => {
    await page.goto(`${hub}/#croft`);
    await expect(page.locator("#croft")).toBeInViewport();
  });
});

test.describe("a project's site", () => {
  test("leads back to Steading from its header", async ({ page }) => {
    await page.goto(`${skift}/`);
    await expect(page.getByRole("banner").getByRole("link", { name: "steading" })).toHaveAttribute("href", "https://stead.ing/");
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
    await page.goto(`${skift}/`);
    await page.getByText("Projects", { exact: true }).click();
    await page.screenshot({ path: `test-results/screenshots/menu-${colorScheme}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${hub}/`);
    await page.screenshot({ path: `test-results/screenshots/hub-phone-${colorScheme}.png`, fullPage: true });
    await page.getByText("Projects", { exact: true }).click();
    await page.screenshot({ path: `test-results/screenshots/menu-phone-${colorScheme}.png`, fullPage: true });
    await context.close();
  });
}
