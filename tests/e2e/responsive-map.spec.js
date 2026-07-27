import { expect, test } from "@playwright/test";
import { responsiveViewports, seedResponsiveProgress } from "./responsive-helpers";

const viewportFor = (testInfo) => responsiveViewports.find((viewport) => viewport.name === testInfo.project.name);

async function openChapterSelect(page) {
  await page.goto("/");
  await page.locator(".v2-hero-actions .primary").click();
  await expect(page.locator(".v2-chapter-grid")).toBeVisible();
}

async function openFirstMap(page) {
  await openChapterSelect(page);
  await page.locator(".v2-chapter-portal").first().getByRole("button").click();
  await expect(page.locator(".v2-constellation-map")).toBeVisible();
}

test("chapter portals use 1/2/3 columns with equal row widths and content-driven height", async ({ page }, testInfo) => {
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
      minHeights: portals.map((portal) => window.getComputedStyle(portal).minHeight),
      descriptionMinHeights: portals.map((portal) => window.getComputedStyle(portal.querySelector("p")).minHeight),
      rowWidths: [...rows.values()],
    };
  });

  const expectedColumns = fixture.viewport.width >= 1024 ? 3 : fixture.viewport.width >= 768 ? 2 : 1;
  expect(layout.columns).toBe(expectedColumns);
  layout.rowWidths.filter((widths) => widths.length > 1).forEach((widths) => {
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  });
  expect(layout.minHeights).toEqual(["auto", "auto", "auto"]);
  expect(layout.descriptionMinHeights).toEqual(["auto", "auto", "auto"]);
});

test("locked chapter gate remains readable", async ({ page }) => {
  await seedResponsiveProgress(page);
  await openChapterSelect(page);

  const lockedGate = page.locator(".v2-chapter-portal.locked").first();
  await expect(lockedGate).toBeVisible();
  await expect(lockedGate.getByRole("button")).toBeDisabled();

  await expect.poll(async () => lockedGate.evaluate((portal) => Number.parseFloat(window.getComputedStyle(portal).opacity))).toBeGreaterThanOrEqual(0.85);
  await expect(lockedGate).toHaveCSS("filter", "none");
});

test("map nodes remain contained and long Thai names wrap inside their cards", async ({ page }) => {
  await seedResponsiveProgress(page);
  await openFirstMap(page);

  const mapLayout = await page.locator(".v2-constellation-map").evaluate((map) => {
    const longName = "ภารกิจฝึกออกเสียงภาษาจีนในสถานการณ์ชีวิตประจำวันอย่างมั่นใจและต่อเนื่อง";
    const firstName = map.querySelector(".v2-level-island strong");
    firstName.textContent = longName;
    const mapRect = map.getBoundingClientRect();
    const cards = [...map.querySelectorAll(".v2-level-island")].map((card) => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    const name = firstName.getBoundingClientRect();
    return {
      map: { left: mapRect.left, right: mapRect.right, top: mapRect.top, bottom: mapRect.bottom },
      cards,
      name: { width: name.width, clientWidth: firstName.clientWidth, scrollWidth: firstName.scrollWidth, height: name.height },
    };
  });

  mapLayout.cards.forEach((card) => {
    expect(card.left).toBeGreaterThanOrEqual(mapLayout.map.left - 1);
    expect(card.right).toBeLessThanOrEqual(mapLayout.map.right + 1);
    expect(card.top).toBeGreaterThanOrEqual(mapLayout.map.top - 1);
    expect(card.bottom).toBeLessThanOrEqual(mapLayout.map.bottom + 1);
  });
  expect(mapLayout.name.scrollWidth).toBeLessThanOrEqual(mapLayout.name.clientWidth + 1);
  expect(mapLayout.name.height).toBeGreaterThan(24);
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
    return {
      mapHeight: mapRect.height,
      cardHeight: map.querySelector(".v2-level-island").getBoundingClientRect().height,
      columns: new Set(slots.map((slot) => slot.left)).size,
    };
  });

  expect(route.columns).toBe(fixture.viewport.width >= 1024 ? 5 : 2);
  expect(route.mapHeight).toBeLessThan(route.cardHeight * 4);
});
