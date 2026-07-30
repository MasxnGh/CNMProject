import { expect, test } from "@playwright/test";
import { responsiveViewports, seedResponsiveProgress } from "./responsive-helpers";

const viewportFor = (testInfo) => responsiveViewports.find((viewport) => viewport.name === testInfo.project.name);
const routePixelTolerance = 2;
const longThaiTitle = "ภารกิจฝึกออกเสียงภาษาจีนในสถานการณ์ชีวิตประจำวันอย่างมั่นใจและต่อเนื่อง";
const longThaiDescription = "ฝึกอ่านคำศัพท์ บทสนทนา และการออกเสียงภาษาจีนอย่างละเอียดเพื่อใช้ในสถานการณ์ชีวิตประจำวันได้อย่างมั่นใจ ".repeat(6);

async function openChapterSelect(page) {
  await page.goto("/classic");
  await page.locator(".v2-hero-actions .primary").click();
  await expect(page.locator(".v2-chapter-grid")).toBeVisible();
}

async function openFirstMap(page) {
  await openChapterSelect(page);
  await page.locator(".v2-chapter-portal").first().getByRole("button").click();
  await expect(page.locator(".v2-constellation-map")).toBeVisible();
}

test("chapter portals use 1/2/3 columns with equal row widths", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  await seedResponsiveProgress(page);
  await openChapterSelect(page);

  const layout = await page.locator(".v2-chapter-grid").evaluate((grid) => {
    const portals = [...grid.querySelectorAll(".v2-chapter-portal")];
    const style = window.getComputedStyle(grid);
    const rows = new Map();
    portals.forEach((portal) => {
      const rect = portal.getBoundingClientRect();
      const key = Math.round(rect.top);
      rows.set(key, [...(rows.get(key) ?? []), rect.width]);
    });
    return {
      columns: style.gridTemplateColumns.split(" ").filter(Boolean).length,
      rowWidths: [...rows.values()],
    };
  });

  const expectedColumns = fixture.viewport.width >= 1024 ? 3 : fixture.viewport.width >= 768 ? 2 : 1;
  expect(layout.columns).toBe(expectedColumns);
  layout.rowWidths.filter((widths) => widths.length > 1).forEach((widths) => {
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  });
});

test("chapter portal grows around long rendered copy without clipping", async ({ page }) => {
  await seedResponsiveProgress(page);
  await openChapterSelect(page);

  const growth = await page.locator(".v2-chapter-portal").first().evaluate((portal, content) => {
    const before = portal.getBoundingClientRect();
    portal.querySelector("h2").textContent = content.title;
    portal.querySelector("p").textContent = content.description;
    const after = portal.getBoundingClientRect();
    const elements = [portal.querySelector("h2"), portal.querySelector("p"), portal.querySelector(".v2-chapter-footer")];
    const portalRect = portal.getBoundingClientRect();
    return {
      beforeHeight: before.height,
      afterHeight: after.height,
      clipped: portal.scrollHeight > portal.clientHeight + 1,
      overflowingText: elements.some((element) => element.scrollWidth > element.clientWidth + 1),
      outside: elements.some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < portalRect.left - 1 || rect.right > portalRect.right + 1 || rect.top < portalRect.top - 1 || rect.bottom > portalRect.bottom + 1;
      }),
    };
  }, { title: longThaiTitle, description: longThaiDescription });

  expect(growth.afterHeight).toBeGreaterThan(growth.beforeHeight + 8);
  expect(growth.clipped).toBe(false);
  expect(growth.overflowingText).toBe(false);
  expect(growth.outside).toBe(false);
});

test("locked chapter gate remains readable", async ({ page }) => {
  await seedResponsiveProgress(page);
  await openChapterSelect(page);

  const lockedGate = page.locator(".v2-chapter-portal.locked").first();
  await expect(lockedGate).toBeVisible();
  // the way in stays shut; the skip-test shortcut beside it is meant to be open
  await expect(lockedGate.getByRole("button", { name: /เข้าแผนที่/ })).toBeDisabled();
  await expect(lockedGate.getByRole("button", { name: /ข้ามด่านด้วยบททดสอบ/ })).toBeEnabled();

  await expect.poll(async () => lockedGate.evaluate((portal) => Number.parseFloat(window.getComputedStyle(portal).opacity))).toBeGreaterThanOrEqual(0.85);
  await expect(lockedGate).toHaveCSS("filter", "none");
});

test("an open stop grows around long Thai content without clipping", async ({ page }) => {
  await seedResponsiveProgress(page);
  await openFirstMap(page);

  // the route opens on the current stop, so a detail sheet is already showing
  const sheet = page.locator(".v2-level-sheet").first();
  await expect(sheet).toBeVisible();

  const layout = await page.locator(".v2-constellation-map").evaluate((map, longName) => {
    const title = map.querySelector(".v2-level-sheet strong");
    const card = title.closest(".v2-level-sheet");
    const beforeMap = map.getBoundingClientRect();
    const beforeCard = card.getBoundingClientRect();
    title.textContent = longName;
    const mapRect = map.getBoundingClientRect();
    const stops = [...map.querySelectorAll(".v2-level-stop")].map((stop) => {
      const rect = stop.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    const name = title.getBoundingClientRect();
    return {
      map: { left: mapRect.left, right: mapRect.right, top: mapRect.top, bottom: mapRect.bottom },
      stops,
      beforeMapHeight: beforeMap.height,
      afterMapHeight: mapRect.height,
      beforeCardHeight: beforeCard.height,
      afterCardHeight: card.getBoundingClientRect().height,
      cardClipped: card.scrollHeight > card.clientHeight + 1,
      name: { clientWidth: title.clientWidth, scrollWidth: title.scrollWidth, height: name.height },
    };
  }, longThaiTitle.repeat(6));

  layout.stops.forEach((stop) => {
    expect(stop.left).toBeGreaterThanOrEqual(layout.map.left - 1);
    expect(stop.right).toBeLessThanOrEqual(layout.map.right + 1);
  });
  expect(layout.name.scrollWidth).toBeLessThanOrEqual(layout.name.clientWidth + 1);
  expect(layout.name.height).toBeGreaterThan(24);
  expect(layout.afterCardHeight).toBeGreaterThan(layout.beforeCardHeight + 8);
  expect(layout.afterMapHeight).toBeGreaterThan(layout.beforeMapHeight + 8);
  expect(layout.cardClipped).toBe(false);
});

test("route beam points match rendered node centers", async ({ page }) => {
  await seedResponsiveProgress(page);
  await openFirstMap(page);

  const beam = page.locator(".v2-route-beam polyline");
  await expect.poll(async () => (await beam.getAttribute("points"))?.trim().split(/\s+/).length ?? 0).toBe(5);

  const geometry = await page.locator(".v2-constellation-map").evaluate((map) => {
    const svg = map.querySelector(".v2-route-beam");
    const polyline = svg.querySelector("polyline");
    const viewBox = svg.viewBox.baseVal;
    const svgRect = svg.getBoundingClientRect();
    const points = (polyline.getAttribute("points") ?? "").trim().split(/\s+/).map((pair) => pair.split(",").map(Number));
    const nodeCenters = [...map.querySelectorAll(".v2-level-island")].map((slot) => {
      const rect = slot.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    return {
      points: points.map(([x, y]) => ({
        x: svgRect.left + x * (svgRect.width / viewBox.width),
        y: svgRect.top + y * (svgRect.height / viewBox.height),
      })),
      nodeCenters,
      viewBox: { width: viewBox.width, height: viewBox.height },
    };
  });

  expect(geometry.viewBox.width).toBeGreaterThan(0);
  expect(geometry.viewBox.height).toBeGreaterThan(0);
  expect(geometry.points).toHaveLength(geometry.nodeCenters.length);
  geometry.points.forEach((point, index) => {
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
    expect(Math.abs(point.x - geometry.nodeCenters[index].x)).toBeLessThanOrEqual(routePixelTolerance);
    expect(Math.abs(point.y - geometry.nodeCenters[index].y)).toBeLessThanOrEqual(routePixelTolerance);
  });
});

test("phone map is a vertical, content-height route", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  test.skip(fixture.viewport.width >= 768, "Phone-only route contract");
  await seedResponsiveProgress(page);
  await openFirstMap(page);

  const route = await page.locator(".v2-constellation-map").evaluate((map) => {
    const mapStyle = window.getComputedStyle(map);
    const slots = [...map.querySelectorAll(".v2-route-slot")].map((slot) => {
      const rect = slot.getBoundingClientRect();
      return { centerX: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom };
    });
    return { minHeight: Number.parseFloat(mapStyle.minHeight), slots };
  });

  expect(route.minHeight).toBe(0);
  expect(Math.max(...route.slots.map((slot) => slot.centerX)) - Math.min(...route.slots.map((slot) => slot.centerX))).toBeLessThanOrEqual(1);
  route.slots.slice(1).forEach((slot, index) => expect(slot.top).toBeGreaterThanOrEqual(route.slots[index].bottom));
});

test("tablet and desktop maps use compact multi-column routes", async ({ page }, testInfo) => {
  const fixture = viewportFor(testInfo);
  test.skip(fixture.viewport.width < 768, "Tablet-and-desktop route contract");
  await seedResponsiveProgress(page);
  await openFirstMap(page);

  const route = await page.locator(".v2-constellation-map").evaluate((map) => {
    const slots = [...map.querySelectorAll(".v2-route-slot")].map((slot) => {
      const rect = slot.getBoundingClientRect();
      return { left: Math.round(rect.left), height: rect.height };
    });
    const mapRect = map.getBoundingClientRect();
    const stopHeights = [...map.querySelectorAll(".v2-level-stop")].map((stop) => stop.getBoundingClientRect().height);
    return {
      mapHeight: mapRect.height,
      stackedHeight: stopHeights.reduce((total, height) => total + height, 0),
      columns: new Set(slots.map((slot) => slot.left)).size,
    };
  });

  expect(route.columns).toBe(fixture.viewport.width >= 1024 ? 5 : 2);
  // laid out across columns rather than stacked into one tall list
  expect(route.mapHeight).toBeLessThan(route.stackedHeight);
});
