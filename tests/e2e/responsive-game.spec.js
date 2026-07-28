import { expect, test } from "@playwright/test";
import {
  assertControlsMeetMinimumSize,
  assertDocumentFitsViewport,
  assertFixedControlDoesNotOverlapPrimaryActions,
  assertMobileHudFits,
  assertVisibleElementsStayInViewport,
  isMobileViewport,
  responsiveViewports,
  seedResponsiveProgress,
} from "./responsive-helpers";

const startAdventure = "เริ่มการผจญภัย";
const openMap = "เข้าแผนที่";

const viewportFor = (testInfo) => responsiveViewports.find((viewport) => viewport.name === testInfo.project.name);

async function openFirstMission(page) {
  await page.getByRole("button", { name: startAdventure }).click();
  await page.getByRole("button", { name: openMap }).first().click();
  await page.locator(".v2-level-island:not(:disabled)").first().click();
  await expect(page.locator(".v2-mission-arena")).toBeVisible();
}

test("Game keeps mission controls reachable without sound-control collisions", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  await seedResponsiveProgress(page, { skipMissionIntro: true });
  await page.goto("/");

  await page.getByRole("button", { name: startAdventure }).click();
  await page.locator("article").filter({ hasText: "เริ่มต้นผจญภัยในเมืองจีน" }).getByRole("button", { name: openMap }).click();
  await page.locator(".v2-level-island").filter({ hasText: "ด่าน 1" }).click();
  await expect(page.locator(".v2-mission-arena")).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));

  await assertDocumentFitsViewport(page, fixture.name);
  await assertVisibleElementsStayInViewport(page, { selector: ".v2-game-header .v2-icon-button", viewportName: fixture.name });

  if (isMobileViewport(fixture.viewport)) {
    await assertMobileHudFits(page, { viewportName: fixture.name });
  }

  await assertControlsMeetMinimumSize(page, { selector: "button", viewportName: fixture.name });
  await assertFixedControlDoesNotOverlapPrimaryActions(page, {
    fixedSelector: ".sound-toggle",
    primarySelector: ".v2-mission-arena button",
    viewportName: fixture.name,
  });
});

test("phone game shell keeps the header, mission HUD, and Panda guide contained", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  test.skip(!isMobileViewport(fixture.viewport), "This geometry contract is for phone viewports.");

  await seedResponsiveProgress(page, { skipMissionIntro: true });
  await page.goto("/");
  await openFirstMission(page);
  await page.locator(".v2-game-header h1").evaluate((title) => {
    title.textContent = "An exceptionally long mission title that must stay inside the game header controls";
  });

  const geometry = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
    };
    const header = document.querySelector(".v2-game-header");
    const hud = document.querySelector(".v2-game-console");
    const panda = document.querySelector(".v2-panda");
    const guide = document.querySelector(".v2-panda-guide");
    const rowTops = [...hud.children]
      // Unrendered children (e.g. the desktop-only back-to-map button) occupy no row.
      .filter((child) => child.getBoundingClientRect().height > 0 && getComputedStyle(child).display !== "none")
      .map((child) => Math.round(child.getBoundingClientRect().top))
      .filter((top, index, values) => values.indexOf(top) === index);
    return {
      header: box(".v2-game-header"),
      title: box(".v2-game-header h1"),
      titleScrollWidth: header.querySelector("h1").scrollWidth,
      titleClientWidth: header.querySelector("h1").clientWidth,
      hud: box(".v2-game-console"),
      arena: box(".v2-mission-arena"),
      hudRows: rowTops.length,
      panda: box(".v2-panda"),
      guide: box(".v2-panda-guide"),
      // Layout width, so the decorative bob rotation's bounding box does not
      // inflate the measurement. A transform: scale() used for sizing would
      // still leave offsetWidth disagreeing with --panda-size.
      pandaLayoutWidth: panda.offsetWidth,
      pandaSize: getComputedStyle(panda).getPropertyValue("--panda-size").trim(),
    };
  });

  expect(geometry.header.height, "Phone game header must remain at or below 88px.").toBeLessThanOrEqual(88);
  expect(geometry.titleScrollWidth, "A long title must fit its min-width: 0 title track.").toBeLessThanOrEqual(geometry.titleClientWidth + 1);
  expect(geometry.title.right, "A long title must not extend beyond the header.").toBeLessThanOrEqual(geometry.header.right + 1);
  expect(geometry.hudRows, "Phone mission HUD may use at most two rows.").toBeLessThanOrEqual(2);
  expect(geometry.hud.bottom, "Mission HUD must finish before the arena begins.").toBeLessThanOrEqual(geometry.arena.top + 1);
  expect(geometry.panda.left, "Panda must stay within its guide container.").toBeGreaterThanOrEqual(geometry.guide.left - 1);
  expect(geometry.panda.right, "Panda must stay within its guide container.").toBeLessThanOrEqual(geometry.guide.right + 1);
  expect(geometry.pandaSize, "Responsive Panda geometry must be driven by --panda-size.").not.toBe("");
  expect(geometry.pandaLayoutWidth, "Panda must render at the --panda-size layout width, without responsive scale().").toBeCloseTo(Number.parseFloat(geometry.pandaSize), 0);
});

test("phone pause control is keyboard-accessible", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  test.skip(!isMobileViewport(fixture.viewport), "This keyboard contract is for phone viewports.");

  await seedResponsiveProgress(page, { skipMissionIntro: true });
  await page.goto("/");
  await openFirstMission(page);

  const pause = page.getByRole("button", { name: "หยุดชั่วคราว" });
  await pause.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "หยุดเกมชั่วคราว" })).toBeVisible();
  await expect(page.getByRole("button", { name: "เล่นต่อ" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "กลับแผนที่" }).last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "เล่นต่อ" })).toBeFocused();
});
