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
