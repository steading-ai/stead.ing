import { expect, test } from "@playwright/test";
import { SITES } from "../../playwright.config.ts";

const hub = `http://127.0.0.1:${SITES.steading.port}`;
const skift = `http://127.0.0.1:${SITES.skift.port}`;
const fixture = `http://127.0.0.1:${SITES.fixture.port}`;

test.describe("the first step", () => {
  test("the prompt can be copied with one button", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${hub}/`);
    // The hub offers the prompt twice: at the top, and again where the story turns.
    await page.getByRole("button", { name: "Copy" }).first().click();
    await expect(page.getByRole("status").first()).toHaveText("Copied. Paste it into your agent.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("https://stead.ing/llms.txt");
  });

  test("without JavaScript the prompt is still there to select, and no dead button", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    await expect(page.getByText("Read https://stead.ing/llms.txt").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(0);
    await context.close();
  });
});

test.describe("the hub's story", () => {
  test("offers the prompt again where the story turns, and it copies too", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${hub}/`);
    const copies = page.getByRole("button", { name: "Copy" });
    await expect(copies).toHaveCount(2);
    await copies.nth(1).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("https://stead.ing/llms.txt");
  });

  test("invites people to the community chat", async ({ page }) => {
    await page.goto(`${hub}/`);
    await expect(page.getByRole("main").getByRole("link", { name: "Join the Discord" })).toHaveAttribute("href", /^https:\/\/discord\.gg\//);
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
    await page.locator("[data-menu] summary").click();
    const menu = page.locator("[data-menu]");
    await expect(menu.getByRole("link")).toHaveCount(11);
    await expect(menu.getByRole("link", { name: /skift.*A task graph agents and people share/ })).toHaveAttribute(
      "href",
      "https://skift.stead.ing/",
    );
  });

  test("sends a project without a site to its row on the hub, and says how far along it is", async ({ page }) => {
    await page.goto(`${skift}/`);
    await page.locator("[data-menu] summary").click();
    const croft = page.locator("[data-menu]").getByRole("link", { name: /croft/ });
    await expect(croft).toHaveAttribute("href", "https://stead.ing/#croft");
    await expect(croft).toContainText("In design");
  });

  test("marks the project whose site this is", async ({ page }) => {
    await page.goto(`${skift}/`);
    await page.locator("[data-menu] summary").click();
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
    await page.locator("[data-menu] summary").click();
    // The open menu covers the top of the page, so click below it.
    await page.getByRole("contentinfo").click();
    await expect(page.locator("[data-menu] .panel")).toBeHidden();
  });

  test("opens under a mouse and closes when the mouse leaves", async ({ page }) => {
    await page.goto(`${hub}/`);
    const panel = page.locator("[data-menu] .panel");
    await page.locator("[data-menu] summary").hover();
    await expect(panel).toBeVisible();
    // Reaching into the panel crosses a gap, and the menu has to survive it.
    await page.locator("[data-menu]").getByRole("link", { name: /mill/ }).hover();
    await expect(panel).toBeVisible();
    await page.getByRole("contentinfo").hover();
    await expect(panel).toBeHidden();
  });

  test("a mouse click on the button doesn't shut a menu the mouse just opened", async ({ page }) => {
    await page.goto(`${hub}/`);
    await page.locator("[data-menu] summary").hover();
    await page.locator("[data-menu] summary").click();
    await expect(page.locator("[data-menu] .panel")).toBeVisible();
  });

  test("still opens without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    await page.locator("[data-menu] summary").click();
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

test.describe("the day strip", () => {
  const merged = (page: import("@playwright/test").Page) =>
    page.locator("[data-count=merged]").evaluate((element) => Number(element.textContent?.replace(/,/g, "")));

  test("counts merged pull requests upward as the day runs", async ({ page }) => {
    await page.goto(`${hub}/`);
    const before = await merged(page);
    await expect.poll(() => merged(page), { timeout: 15_000 }).toBeGreaterThan(before);
  });

  test("says what an event was, and what set it off, when pointed at", async ({ page }) => {
    await page.goto(`${hub}/`);
    const strip = page.locator("[data-timeline]");
    // Runs still ahead of "now" are drawn but out of sight, so pick one in the middle of the strip.
    const frame = await strip.locator("svg[role=img]").boundingBox();
    const boxes = await strip.locator("[data-scroll] .clip.p-mill").evaluateAll((clips) => clips.map((clip) => clip.getBoundingClientRect().toJSON()));
    const box = boxes.find((candidate) => frame && candidate.x > frame.x + frame.width * 0.4 && candidate.x < frame.x + frame.width * 0.8);
    if (!box) throw new Error("no mill run is drawn in the middle of the strip");
    await page.mouse.move(box.x + 2, box.y + 2);
    const tip = strip.locator("[data-tip]");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("mill");
    await expect(tip).toContainText(/merged|Planning/);
    // Its story is picked out, and the rest of the day is quieted.
    await expect(strip.locator("svg[role=img]")).toHaveClass(/focused/);
    expect(await strip.locator(".in-story").count()).toBeGreaterThan(1);
  });

  test("stops and starts from its button", async ({ page }) => {
    await page.goto(`${hub}/`);
    const strip = page.locator("[data-timeline]");
    const position = () => strip.locator("[data-scroll]").getAttribute("transform");
    await strip.getByRole("button", { name: "Pause" }).click();
    const held = await position();
    await page.waitForTimeout(500);
    expect(await position()).toBe(held);
    await strip.getByRole("button", { name: "Play" }).click();
    await expect.poll(position).not.toBe(held);
  });

  test("holds still for someone who asked for less motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    const strip = page.locator("[data-timeline]");
    await expect(strip.getByRole("button", { name: "Play" })).toBeVisible();
    const held = await strip.locator("[data-scroll]").getAttribute("transform");
    await page.waitForTimeout(500);
    expect(await strip.locator("[data-scroll]").getAttribute("transform")).toBe(held);
    await context.close();
  });

  test("is one drawn frame without JavaScript, with no dead button", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    const strip = page.locator("[data-timeline]");
    expect(await strip.locator("[data-scroll] .clip").count()).toBeGreaterThan(10);
    await expect(strip.getByRole("button")).toHaveCount(0);
    await expect(strip.locator("[data-latest]")).not.toBeEmpty();
    await context.close();
  });
});

test.describe("the hub's list of projects", () => {
  test("a row that leads somewhere is clickable anywhere on it", async ({ page }) => {
    await page.goto(`${hub}/`);
    const row = page.locator("#skift");
    await expect(row.getByRole("link", { name: "skift" })).toHaveAttribute("href", "https://skift.stead.ing/");
    // The problem sits at the far side of the row from the name; a click there must still land on the link.
    const pain = row.locator(".pain");
    await pain.scrollIntoViewIfNeeded();
    const under = await pain.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + 10, box.top + 10);
      return { href: top?.closest("a")?.href, cursor: top ? getComputedStyle(top).cursor : "" };
    });
    expect(under).toEqual({ href: "https://skift.stead.ing/", cursor: "pointer" });
  });

  test("a row with nowhere to lead is not a link", async ({ page }) => {
    await page.goto(`${hub}/`);
    await expect(page.locator("#croft").getByRole("link")).toHaveCount(0);
  });
});

test.describe("the footer", () => {
  test("lists every project and the ways in for an agent", async ({ page }) => {
    await page.goto(`${skift}/`);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("navigation", { name: "Projects" }).getByRole("link")).toHaveCount(10);
    await expect(footer.getByRole("link", { name: "Open for good" })).toHaveAttribute("href", "https://stead.ing/open-for-good/");
    await expect(footer.getByRole("link", { name: "This page as Markdown" })).toHaveAttribute("href", "/index.md");
    await expect(footer.getByRole("link", { name: "llms.txt", exact: true })).toHaveAttribute("href", "/llms.txt");
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
    await page.locator("[data-menu] summary").click();
    await page.screenshot({ path: `test-results/screenshots/menu-${colorScheme}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${hub}/`);
    await page.screenshot({ path: `test-results/screenshots/hub-phone-${colorScheme}.png`, fullPage: true });
    await page.locator("[data-menu] summary").click();
    await page.screenshot({ path: `test-results/screenshots/menu-phone-${colorScheme}.png`, fullPage: true });
    await context.close();
  });
}
