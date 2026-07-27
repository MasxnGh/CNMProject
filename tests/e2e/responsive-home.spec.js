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

const viewportFor = (testInfo) => responsiveViewports.find((viewport) => viewport.name === testInfo.project.name);

test("Home exposes the responsive scene and container foundation", async ({ page }) => {
  await page.goto("/");

  const foundation = await page.locator(".dq-scene").evaluate((scene) => {
    const container = scene.querySelector(".dq-container");
    const sceneStyle = window.getComputedStyle(scene);
    const containerStyle = container ? window.getComputedStyle(container) : null;
    const controlProbe = document.createElement("div");
    controlProbe.style.cssText = "display:block; height:var(--dq-control-height); position:absolute;";
    scene.append(controlProbe);
    const controlHeight = Number.parseFloat(window.getComputedStyle(controlProbe).height);
    controlProbe.remove();
    return {
      controlHeight,
      minHeight: sceneStyle.minHeight,
      minWidth: sceneStyle.minWidth,
      scenePaddingLeft: Number.parseFloat(sceneStyle.paddingLeft),
      scenePaddingRight: Number.parseFloat(sceneStyle.paddingRight),
      containerPresent: Boolean(containerStyle),
      viewportHeight: window.innerHeight,
    };
  });

  expect(foundation.controlHeight).toBeGreaterThanOrEqual(44);
  expect(foundation.minWidth).toBe("0px");
  expect(foundation.minHeight).toBe(`${foundation.viewportHeight}px`);
  expect(foundation.containerPresent).toBe(true);
  expect(foundation.scenePaddingLeft).toBe(foundation.scenePaddingRight);
});

test("Home keeps the first adventure action usable without clipping", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  await seedResponsiveProgress(page);
  await page.goto("/");

  const primaryAction = page.getByRole("button", { name: startAdventure });
  await expect(primaryAction).toBeVisible();

  await assertDocumentFitsViewport(page, fixture.name);
  await assertVisibleElementsStayInViewport(page, { selector: ".v2-hero-actions .primary", viewportName: fixture.name });

  if (isMobileViewport(fixture.viewport)) {
    await assertMobileHudFits(page, { viewportName: fixture.name });
  }

  await assertControlsMeetMinimumSize(page, { selector: "button", viewportName: fixture.name });
  await assertFixedControlDoesNotOverlapPrimaryActions(page, {
    fixedSelector: ".sound-toggle",
    primarySelector: ".v2-hero-actions .primary",
    viewportName: fixture.name,
  });
});
