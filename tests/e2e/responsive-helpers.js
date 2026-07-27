import { expect } from "@playwright/test";

export const responsiveViewports = [
  { name: "mobile-320x568", viewport: { width: 320, height: 568 } },
  { name: "mobile-375x812", viewport: { width: 375, height: 812 } },
  { name: "mobile-390x844", viewport: { width: 390, height: 844 } },
  { name: "mobile-landscape-667x375", viewport: { width: 667, height: 375 } },
  { name: "tablet-768x1024", viewport: { width: 768, height: 1024 } },
  { name: "tablet-landscape-1024x768", viewport: { width: 1024, height: 768 } },
  { name: "desktop-1440x900", viewport: { width: 1440, height: 900 } },
  { name: "short-landscape-568x320", viewport: { width: 568, height: 320 } },
];

const visibleRectangles = async (page, selector) => page.evaluate((targetSelector) =>
  [...document.querySelectorAll(targetSelector)]
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const accessibleName = element.getAttribute("aria-label") ?? element.textContent.trim().replace(/\s+/g, " ");
      return {
        selector: element.id
          ? `#${element.id}`
          : accessibleName
            ? `${element.tagName.toLowerCase()}[accessible name=\"${accessibleName}\"]`
            : targetSelector,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility,
      };
    })
    .filter((rect) => rect.width > 0 && rect.height > 0 && rect.display !== "none" && rect.visibility !== "hidden"),
  selector,
);

const boxLabel = (box) => `x=${Math.round(box.x)}, y=${Math.round(box.y)}, ${Math.round(box.width)}x${Math.round(box.height)}`;

const identifiedBoxLabel = (box) => `${box.selector} (${boxLabel(box)})`;

const viewportLabel = (viewportName, viewport) => `${viewportName} (${viewport.width}x${viewport.height})`;

export const getViewport = async (page) => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));

export async function assertDocumentFitsViewport(page, viewportName) {
  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientHeight: document.documentElement.clientHeight,
    clientWidth: document.documentElement.clientWidth,
  }));
  const viewport = { width: metrics.clientWidth, height: metrics.clientHeight };

  expect(
    metrics.scrollWidth,
    `Viewport ${viewportLabel(viewportName, viewport)} has horizontal document overflow: scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth}.`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

export async function assertVisibleElementsStayInViewport(page, { selector, viewportName }) {
  const [viewport, rectangles] = await Promise.all([getViewport(page), visibleRectangles(page, selector)]);
  const outside = rectangles.filter((rect) => rect.x < 0 || rect.y < 0 || rect.x + rect.width > viewport.width || rect.y + rect.height > viewport.height);

  expect(
    outside,
    `Viewport ${viewportLabel(viewportName, viewport)} clips visible ${selector}: ${outside.map(boxLabel).join("; ")}.`,
  ).toEqual([]);
}

export async function assertControlsMeetMinimumSize(page, { selector = "button", viewportName, minimumSize = 44 }) {
  const [viewport, rectangles] = await Promise.all([getViewport(page), visibleRectangles(page, selector)]);
  const undersized = rectangles.filter((rect) => rect.width < minimumSize || rect.height < minimumSize);

  expect(
    undersized,
    `Viewport ${viewportLabel(viewportName, viewport)} has ${selector} controls below ${minimumSize}x${minimumSize}: ${undersized.map(identifiedBoxLabel).join("; ")}.`,
  ).toEqual([]);
}

export async function assertFixedControlDoesNotOverlapPrimaryActions(page, { fixedSelector, primarySelector, viewportName }) {
  const [viewport, fixedControls, primaryActions] = await Promise.all([
    getViewport(page),
    visibleRectangles(page, fixedSelector),
    visibleRectangles(page, primarySelector),
  ]);
  const overlaps = fixedControls.flatMap((fixed) => primaryActions
    .filter((action) => fixed.x < action.x + action.width
      && fixed.x + fixed.width > action.x
      && fixed.y < action.y + action.height
      && fixed.y + fixed.height > action.y)
    .map((action) => `${fixedSelector} (${boxLabel(fixed)}) overlaps ${primarySelector} (${boxLabel(action)})`));

  expect(
    overlaps,
    `Viewport ${viewportLabel(viewportName, viewport)} has fixed sound control overlap: ${overlaps.join("; ")}.`,
  ).toEqual([]);
}

export async function assertMobileHudFits(page, { selector = ".v2-status-hud", viewportName, maxRows = 2, maxHeight = 220 }) {
  const [viewport, hudLocator] = await Promise.all([getViewport(page), page.locator(selector)]);
  await expect(
    hudLocator,
    `Viewport ${viewportLabel(viewportName, viewport)} must contain exactly one ${selector} before measuring mobile HUD rows and height.`,
  ).toHaveCount(1);
  const hud = await hudLocator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const rows = [...element.children]
      .map((child) => child.getBoundingClientRect().top)
      .reduce((tops, top) => (tops.some((knownTop) => Math.abs(knownTop - top) < 2) ? tops : [...tops, top]), []);
    return { height: bounds.height, rows: rows.length };
  });

  expect(
    hud.rows,
    `Viewport ${viewportLabel(viewportName, viewport)} wraps ${selector} into ${hud.rows} rows; the mobile HUD limit is ${maxRows} rows.`,
  ).toBeLessThanOrEqual(maxRows);
  expect(
    hud.height,
    `Viewport ${viewportLabel(viewportName, viewport)} makes ${selector} ${Math.round(hud.height)}px tall; the mobile HUD limit is ${maxHeight}px.`,
  ).toBeLessThanOrEqual(maxHeight);
}

export const isMobileViewport = (viewport) => viewport.width <= 568;

export async function seedResponsiveProgress(page, { skipMissionIntro = false } = {}) {
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress", JSON.stringify(saved)), {
    unlockedLevels: [1],
    completedLevels: [],
    levelStars: {},
    totalStars: 0,
    xp: 0,
    level: 1,
    coins: 0,
    badges: [],
    unlockedKnowledge: [],
    lastPlayedLevel: 1,
    soundEnabled: false,
    reducedMotion: true,
    skipMissionIntro,
  });
}
