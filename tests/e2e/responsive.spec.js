import { expect, test } from "@playwright/test";
import { assertDocumentFitsViewport } from "./responsive-helpers";

for (const viewport of [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`home fits ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "เริ่มการผจญภัย" })).toBeVisible({ timeout: 7000 });
    await assertDocumentFitsViewport(page, viewport.name);
  });
}
