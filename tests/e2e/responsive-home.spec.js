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
    return {
      minHeight: sceneStyle.minHeight,
      minWidth: sceneStyle.minWidth,
      scenePaddingLeft: Number.parseFloat(sceneStyle.paddingLeft),
      scenePaddingRight: Number.parseFloat(sceneStyle.paddingRight),
      containerPresent: Boolean(containerStyle),
      viewportHeight: window.innerHeight,
    };
  });

  expect(foundation.minWidth).toBe("0px");
  expect(foundation.minHeight).toBe(`${foundation.viewportHeight}px`);
  expect(foundation.containerPresent).toBe(true);
  expect(foundation.scenePaddingLeft).toBe(foundation.scenePaddingRight);
});

test("Home keeps a symmetric gutter when safe-area insets differ", async ({ page }) => {
  await page.goto("/");

  const gutter = await page.locator(".dq-scene").evaluate((scene) => {
    const container = scene.querySelector(".dq-container");
    scene.style.setProperty("--dq-safe-area-left", "13px");
    scene.style.setProperty("--dq-safe-area-right", "80px");
    const sceneStyle = window.getComputedStyle(scene);
    const sceneRect = scene.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
      leftPadding: Number.parseFloat(sceneStyle.paddingLeft),
      rightPadding: Number.parseFloat(sceneStyle.paddingRight),
      leftGutter: containerRect.left - sceneRect.left,
      rightGutter: sceneRect.right - containerRect.right,
    };
  });

  expect(gutter.leftPadding).toBe(80);
  expect(gutter.rightPadding).toBe(80);
  expect(gutter.leftGutter).toBeCloseTo(gutter.rightGutter, 3);
});

test("Home uses the shared minimum size for rendered compact and modal controls", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  await page.goto("/");

  await page.getByRole("button", { name: "เริ่มใหม่" }).click();
  await page.waitForTimeout(500);
  await assertControlsMeetMinimumSize(page, { selector: ".v2-modal-close", viewportName: fixture.name });
  await page.locator(".v2-modal-close").click();

  await page.locator(".v2-hero-actions .primary").click();
  await page.waitForTimeout(500);
  await assertControlsMeetMinimumSize(page, { selector: ".v2-button.mini", viewportName: fixture.name });
});

test("Modal close target stays at least 44px throughout its entrance", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.modalCloseSamples = [];
    const observer = new MutationObserver(() => {
      const control = document.querySelector(".v2-modal-close");
      if (!control || window.modalCloseObserverStarted) return;
      window.modalCloseObserverStarted = true;
      const sample = () => {
        const bounds = control.getBoundingClientRect();
        window.modalCloseSamples.push({ width: bounds.width, height: bounds.height });
        if (window.modalCloseSamples.length < 24) requestAnimationFrame(sample);
      };
      sample();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole("button", { name: "เริ่มใหม่" }).click();

  await page.waitForFunction(() => window.modalCloseSamples.length === 24);
  const sizes = await page.evaluate(() => window.modalCloseSamples);

  expect(Math.min(...sizes.map(({ width }) => width))).toBeGreaterThanOrEqual(44);
  expect(Math.min(...sizes.map(({ height }) => height))).toBeGreaterThanOrEqual(44);
});

test("Desktop preserves the library command and map legend layout contracts", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  test.skip(fixture.name !== "desktop-1440x900", "Desktop-only layout contract");
  await seedResponsiveProgress(page);
  await page.goto("/");

  await page.locator(".v2-hero-actions button").nth(1).click();
  await expect(page.locator(".v2-library-command")).toBeVisible();
  const libraryTracks = await page.locator(".v2-library-command").evaluate((element) => window.getComputedStyle(element).gridTemplateColumns.split(" ").map(Number.parseFloat));
  expect(libraryTracks).toHaveLength(2);
  expect(libraryTracks[0]).toBeLessThan(libraryTracks[1]);

  await page.locator(".v2-page-top .v2-icon-button").click();
  await page.locator(".v2-hero-actions .primary").click();
  await page.locator(".v2-chapter-portal").first().getByRole("button").click();
  await expect(page.locator(".v2-map-legend")).toBeVisible();
  await expect(page.locator(".v2-map-legend")).toHaveCSS("justify-content", "space-between");
});

test("Home content wrapper does not force its own viewport-height floor", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  test.skip(fixture.name !== "tablet-landscape-1024x768", "Tablet-landscape viewport contract");
  await seedResponsiveProgress(page);
  await page.goto("/");

  const bounds = await page.locator(".dq-scene").evaluate((scene) => {
    const container = scene.querySelector(".dq-container");
    return {
      containerHeight: container.getBoundingClientRect().height,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });

  expect(bounds.containerHeight).toBeLessThan(bounds.viewportHeight - 40);
  expect(bounds.documentHeight).toBeLessThanOrEqual(bounds.viewportHeight + 1);
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
