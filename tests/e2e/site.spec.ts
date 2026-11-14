import { expect, test } from "@playwright/test";
import { SITES } from "../../playwright.config.ts";

const hub = `http://127.0.0.1:${SITES.steading.port}`;
// The fixture is a project's site (it says it is skift's), built from a README and a docs folder.
const fixture = `http://127.0.0.1:${SITES.fixture.port}`;
const skift = fixture;

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

test.describe("the hub's story", () => {
  test("says where the bottleneck is in half a screen, between the hero and the map", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${hub}/`);
    const why = page.locator("section.why");
    await expect(why.locator(".steps li")).toHaveCount(5);
    await expect(why).toContainText("The bottleneck is you.");
    const box = await why.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(450);
    const between = await page.evaluate(() => {
      const [hero, section, map] = [".hero", "section.why", "section.platform"].map((selector) => document.querySelector(selector));
      const follows = (a: Element | null | undefined, b: Element | null | undefined) => Boolean(a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return follows(hero, section) && follows(section, map);
    });
    expect(between).toBe(true);
  });

  test("leads from the day's last step to how Steading came about", async ({ page }) => {
    await page.goto(`${hub}/`);
    await page.getByRole("link", { name: "We hit the same wall." }).click();
    await expect(page).toHaveURL(/\/history\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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
    // Seven projects lead somewhere, and one link leads to how they fit together.
    await expect(menu.getByRole("link")).toHaveCount(8);
    // A project with a site of its own leads there; one on the hub's map leads to its closer look there.
    await expect(menu.getByRole("link", { name: /skift.*A task graph agents and people share/ })).toHaveAttribute("href", "https://skift.stead.ing/");
    await expect(menu.getByRole("link", { name: /croft/ })).toHaveAttribute("href", "/#croft");
  });

  test("sends a project without a site to its closer look on the hub, and says how far along it is", async ({ page }) => {
    await page.goto(`${skift}/`);
    await page.locator("[data-menu] summary").click();
    const croft = page.locator("[data-menu]").getByRole("link", { name: /croft/ });
    await expect(croft).toHaveAttribute("href", "https://stead.ing/#croft");
    await expect(croft).toContainText("In design");
  });

  test("lists a project with nowhere to lead yet, without a link", async ({ page }) => {
    await page.goto(`${hub}/`);
    await page.locator("[data-menu] summary").click();
    const menu = page.locator("[data-menu]");
    await expect(menu.getByText("Disk cleanup for what agents leave behind")).toBeVisible();
    await expect(menu.getByRole("link", { name: /fallow/ })).toHaveCount(0);
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

  test("the hub's closer look at a project is where its menu link lands", async ({ page }) => {
    await page.goto(`${hub}/#croft`);
    await expect(page.locator("#croft")).toBeVisible();
    await expect(page.locator("#croft")).toBeInViewport();
    await expect(page.getByRole("radio", { name: "croft" })).toBeChecked();
  });
});

test.describe("a project's site", () => {
  test("leads back to Steading from its header", async ({ page }) => {
    await page.goto(`${skift}/`);
    await expect(page.getByRole("banner").getByRole("link", { name: "steading" })).toHaveAttribute("href", "https://stead.ing/");
  });
});

test.describe("the day strip", () => {
  test("says what an event was, and what set it off, when pointed at", async ({ page }) => {
    await page.goto(`${hub}/`);
    const strip = page.locator("[data-timeline]");
    // The mouse can only point at what is on screen, and the strip sits below the fold.
    await strip.scrollIntoViewIfNeeded();
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
    await context.close();
  });
});

test.describe("the product map", () => {
  test("fits in one screen of a desktop window, with its closer look, key, and steps", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${hub}/`);
    const section = page.locator("section.platform");
    await expect(section.locator(".about")).toBeVisible();
    await expect(section.locator(".legend li")).toHaveCount(8);
    await expect(section.locator(".loop li")).toHaveCount(5);
    const box = await section.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(900);
  });

  test("without JavaScript, every project on it leads to its site or its closer look", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    const map = page.locator("figure.flow");
    const links = map.getByRole("link");
    await expect(links).toHaveCount(7);
    await expect(map.getByRole("link", { name: /skift/ })).toHaveAttribute("href", "https://skift.stead.ing/");
    await map.getByRole("link", { name: /croft/ }).click();
    await expect(page).toHaveURL(/#croft$/);
    await expect(page.locator("#croft")).toBeVisible();
    await expect(page.locator(".panel.p-skift")).toBeHidden();
    // The project sent for gives way to whichever is picked next.
    await page.locator(".tabs label.p-mill").click();
    await expect(page.locator(".panel.p-mill")).toBeVisible();
    await expect(page.locator("#croft")).toBeHidden();
    await context.close();
  });

  test("looks closer at the project picked on the map, and says how far along it is", async ({ page }) => {
    await page.goto(`${hub}/`);
    const section = page.locator("section.platform");
    await expect(section.locator(".panel.p-skift")).toBeVisible();
    await section.locator("figure.flow").getByRole("link", { name: /croft/ }).click();
    const croft = section.locator(".panel.p-croft");
    await expect(croft).toBeVisible();
    await expect(croft).toContainText("Credentials die with the machine.");
    await expect(croft).toContainText("In design.");
    await expect(section.locator(".panel.p-skift")).toBeHidden();
    await expect(page).not.toHaveURL(/#croft$/);
  });

  test("changes the closer look without JavaScript, by pointer or keyboard", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${hub}/`);
    const section = page.locator("section.platform");
    await section.locator(".tabs label.p-mill").click();
    await expect(section.locator(".panel.p-mill")).toBeVisible();
    await expect(section.getByRole("radio", { name: "mill" })).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(section.locator(".panel.p-almanac")).toBeVisible();
    await expect(section.locator(".panel.p-mill")).toBeHidden();
    await context.close();
  });

  test("moves, and holds still for someone who asked for less motion", async ({ page, browser }) => {
    await page.goto(`${hub}/`);
    const playing = (target: import("@playwright/test").Page) =>
      target.locator("figure.flow .token").nth(1).evaluate((element) => getComputedStyle(element).animationName);
    expect(await playing(page)).not.toBe("none");
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const still = await context.newPage();
    await still.goto(`${hub}/`);
    expect(await playing(still)).toBe("none");
    await context.close();
  });

  test("describes the loop in words for anyone who cannot see it", async ({ page }) => {
    await page.goto(`${hub}/`);
    await expect(page.locator("figure.flow figcaption")).toContainText("Mill works each task inside a croft");
  });
});

test.describe("the hub's first pieces", () => {
  test("offers three projects to start with, after the map", async ({ page }) => {
    await page.goto(`${hub}/`);
    const start = page.locator("section.start");
    await expect(start.getByRole("heading", { level: 3 })).toHaveText(["skift", "mill", "almanac"]);
    const after = await page.evaluate(() => {
      const [map, section] = ["section.platform", "section.start"].map((selector) => document.querySelector(selector));
      return Boolean(map && section && map.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(after).toBe(true);
  });

  test("a card is one link to the project's own site", async ({ page }) => {
    await page.goto(`${hub}/`);
    const need = page.locator("section.start").getByText("Your dependency updates keep breaking.");
    await need.scrollIntoViewIfNeeded();
    const under = await need.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return document.elementFromPoint(box.left + 10, box.top + 10)?.closest("a")?.href;
    });
    expect(under).toBe("https://almanac.stead.ing/");
  });
});

test.describe("what we believe", () => {
  test("says six things, three to a row on a wide screen, before the closing invitation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${hub}/`);
    const beliefs = page.locator("section.beliefs");
    await expect(beliefs.getByRole("heading", { level: 3 })).toHaveCount(6);
    await expect(beliefs.getByRole("heading", { level: 3 }).first()).toHaveText("You decide. Agents do the rest.");
    const tops = await beliefs.locator("li").evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(2);
    const before = await page.evaluate(() => {
      const [section, join] = ["section.beliefs", "#join"].map((selector) => document.querySelector(selector));
      return Boolean(section && join && section.compareDocumentPosition(join) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(before).toBe(true);
  });
});

test.describe("the footer", () => {
  test("lists every project and the ways in for an agent", async ({ page }) => {
    await page.goto(`${skift}/`);
    const footer = page.getByRole("contentinfo");
    // All ten are named; the seven with somewhere to lead are links.
    await expect(footer.getByRole("navigation", { name: "Projects" }).getByRole("listitem")).toHaveCount(10);
    await expect(footer.getByRole("navigation", { name: "Projects" }).getByRole("link")).toHaveCount(7);
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

test.describe("a project's front page", () => {
  test("repeats the prompt in the quick start, where it is needed, and it copies there too", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${fixture}/`);
    const step = page.locator("#quickstart").locator("xpath=..").getByRole("listitem").first();
    await step.getByRole("button", { name: "Copy" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "Read https://skift.stead.ing/llms.txt and help me figure out if skift is a good fit for my work.",
    );
  });

  test("shows one node of the plan at a time, and the one that is picked", async ({ page }) => {
    await page.goto(`${fixture}/`);
    const plan = page.locator("[data-plan]", { has: page.locator("svg") });
    await expect(plan.locator("[data-card].shown")).toHaveCount(1);
    await plan.getByRole("link", { name: /#3 A question/ }).click();
    await expect(plan.locator("[data-card].shown")).toContainText("Needs a person");
    await expect(plan.locator("[data-card].shown")).toContainText("Only a person can do it.");
    // Picking a node stops the card moving on by itself.
    await page.waitForTimeout(4600);
    await expect(plan.locator("[data-card].shown")).toContainText("A question");
  });

  test("shows one step of a run at a time, with the fact that closed it", async ({ page }) => {
    await page.goto(`${fixture}/`);
    const run = page.locator("[data-plan]", { has: page.locator("ol") });
    await expect(run.locator("[data-card].shown")).toHaveCount(1);
    await expect(run.getByRole("link", { name: /write closed on 3f9c2ab/ })).toBeVisible();
    await run.getByRole("link", { name: /approve/ }).click();
    await expect(run.locator("[data-card].shown")).toContainText("Needs a person");
    await expect(run.locator("[data-card].shown")).toContainText("Only a person can close it.");
    await run.getByRole("link", { name: /write/ }).click();
    await expect(run.locator("[data-card].shown")).toContainText("3f9c2ab");
  });

  test("sends what a project is not to the project that is", async ({ page }) => {
    await page.goto(`${fixture}/`);
    const row = page.getByRole("row", { name: /Not a runner/ });
    await expect(row.getByRole("link", { name: "mill" })).toHaveAttribute("href", "https://mill.stead.ing/");
  });

  test("ends on the invitation, with a way to start", async ({ page }) => {
    await page.goto(`${fixture}/`);
    await expect(page.getByRole("heading", { name: "Don't build it all on your own!" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "#quickstart");
  });
});

test.describe("a project's docs", () => {
  test("open on the project's README, called the overview", async ({ page }) => {
    await page.goto(`${fixture}/`);
    await page.getByRole("banner").getByRole("link", { name: "Docs" }).click();
    await expect(page).toHaveURL(/\/docs\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fixture project");
    const nav = page.getByRole("navigation", { name: "Pages" });
    await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("banner").getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
  });

  test("turn the README's links into pages, folders and source", async ({ page }) => {
    await page.goto(`${fixture}/docs/`);
    const article = page.getByRole("article");
    await expect(article.getByRole("link", { name: "the reference" })).toHaveAttribute("href", "/docs/reference/");
    await expect(article.getByRole("link", { name: "the guide" })).toHaveAttribute("href", "/docs/guide/");
    await expect(article.getByRole("link", { name: "a step" })).toHaveAttribute("href", "/docs/guide/first/#then");
    await expect(article.getByRole("link", { name: "decisions" })).toHaveAttribute("href", "/docs/adrs/");
    await expect(article.getByRole("link", { name: "license" })).toHaveAttribute("href", "https://github.com/steading-ai/skift/blob/main/LICENSE");
    await expect(article.getByRole("link", { name: "packaging" })).toHaveAttribute("href", "https://github.com/steading-ai/skift/tree/main/packaging");
  });

  test("give a folder with no page of its own one that lists it", async ({ page }) => {
    await page.goto(`${fixture}/docs/adrs/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Decisions");
    const listed = page.getByRole("article").getByRole("link");
    await expect(listed).toHaveText(["001: A first decision", "002: A second decision"]);
    await listed.first().click();
    await expect(page).toHaveURL(/\/docs\/adrs\/001-first-decision\/$/);
  });

  test("keep a folder's pages out of the navigation until you are in the folder", async ({ page }) => {
    await page.goto(`${fixture}/docs/`);
    const nav = page.getByRole("navigation", { name: "Pages" });
    await expect(nav.getByRole("link", { name: "The guide" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "First steps" })).toHaveCount(0);
    await nav.getByRole("link", { name: "The guide" }).click();
    await expect(nav.getByRole("link", { name: "The guide" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "First steps" })).toBeVisible();
  });

  test("keep a folded section shut until you open it", async ({ page }) => {
    await page.goto(`${fixture}/docs/`);
    const nav = page.getByRole("navigation", { name: "Pages" });
    await expect(nav.getByText("Using it")).toBeVisible();
    await expect(nav.getByRole("link", { name: "Commands" })).toBeHidden();
    await nav.getByText("Building it").click();
    await expect(nav.getByRole("link", { name: "Commands" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Decisions" })).toBeVisible();
  });

  test("open a folded section for the page it holds, under the name the section gives it", async ({ page }) => {
    await page.goto(`${fixture}/docs/reference/`);
    const nav = page.getByRole("navigation", { name: "Pages" });
    await expect(nav.getByRole("link", { name: "Commands" })).toHaveAttribute("aria-current", "page");
    await page.goto(`${fixture}/docs/adrs/002-second-decision/`);
    await expect(nav.getByRole("link", { name: "Decisions" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "002: A second decision" })).toHaveAttribute("aria-current", "page");
  });

  test("leave out what the project excludes", async ({ request }) => {
    expect((await request.get(`${fixture}/docs/drafts/unfinished/`)).status()).toBe(404);
    expect((await request.get(`${fixture}/docs/adrs/000-template/`)).status()).toBe(404);
  });
});

test.describe("pages", () => {
  test("the navigation marks the page you're on", async ({ page }) => {
    await page.goto(`${fixture}/docs/guide/first/`);
    const nav = page.getByRole("navigation", { name: "Pages" });
    await expect(nav.getByRole("link", { name: "First steps" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Overview" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fixture project");
  });

  test.describe("on a wide window", () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test("a long page lists its sections beside it", async ({ page }) => {
      await page.goto(`${fixture}/docs/guide/long/`);
      const contents = page.getByRole("navigation", { name: "On this page" });
      await expect(contents.getByRole("link")).toHaveText(["Install", "With a package", "From source", "Configure", "Check it works"]);
      await expect(page.locator("details.toc")).toBeHidden();
    });

    test("the list marks the section being read, and follows the reader down the page", async ({ page }) => {
      await page.goto(`${fixture}/docs/guide/long/`);
      const contents = page.getByRole("navigation", { name: "On this page" });
      await expect(contents.locator('[aria-current="true"]')).toHaveCount(0);
      await contents.getByRole("link", { name: "From source" }).click();
      await expect(page).toHaveURL(/#from-source$/);
      await expect(contents.locator('[aria-current="true"]')).toHaveText("From source");
      await page.getByRole("heading", { name: "Configure" }).evaluate((heading) => scrollTo(0, scrollY + heading.getBoundingClientRect().top - 40));
      await expect(contents.locator('[aria-current="true"]')).toHaveText("Configure");
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect(contents.locator('[aria-current="true"]')).toHaveText("Check it works");
      await page.evaluate(() => scrollTo(0, 0));
      await expect(contents.locator('[aria-current="true"]')).toHaveCount(0);
    });

    test("a page with one section or none has no list", async ({ page }) => {
      await page.goto(`${fixture}/docs/guide/first/`);
      await expect(page.getByRole("heading", { name: "Then" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(0);
    });

    test("the navigation and the list stay in view down a long page", async ({ page }) => {
      await page.goto(`${fixture}/docs/guide/long/`);
      await page.evaluate(() => scrollTo(0, 1500));
      await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Overview" })).toBeInViewport();
      await expect(page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Install", exact: true })).toBeInViewport();
    });
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("a long page's sections are folded above it", async ({ page }) => {
      await page.goto(`${fixture}/docs/guide/long/`);
      const contents = page.getByRole("navigation", { name: "On this page" });
      await expect(contents).toBeHidden();
      await page.locator("details.toc summary").click();
      await contents.getByRole("link", { name: "Configure" }).click();
      await expect(page).toHaveURL(/#configure$/);
      await expect(page.getByRole("heading", { name: "Configure" })).toBeInViewport();
    });
  });

  test("the Markdown twin is served as Markdown", async ({ request }) => {
    const response = await request.get(`${fixture}/docs/guide/first.md`);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    expect(await response.text()).toContain("canonical: https://skift.stead.ing/docs/guide/first/");
  });
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`screenshots, ${colorScheme}`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    for (const [name, url] of Object.entries({ hub: `${hub}/`, project: `${fixture}/`, page: `${fixture}/docs/reference/` })) {
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
