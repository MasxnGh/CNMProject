import { expect, test } from "@playwright/test";

test("route map loads with the first node unlocked and everything else locked", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".rm-node")).toHaveCount(15);
  await expect(page.locator(".rm-node.current")).toHaveCount(1);
  await expect(page.locator(".rm-node.locked")).toHaveCount(14);
  await expect(page.getByRole("button", { name: /โหนด 1 - ด่านปัจจุบัน/ })).toBeVisible();
});

test("tapping the current node opens a start sheet and starting it navigates to the lesson route", async ({ page }) => {
  // The current node bounces continuously to draw attention (disabled under
  // prefers-reduced-motion), which otherwise never lets Playwright's
  // actionability check see it as "stable" long enough to click.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.getByRole("button", { name: /โหนด 1 - ด่านปัจจุบัน/ }).click();
  await expect(page.locator(".rm-sheet")).toBeVisible();
  await expect(page.locator(".rm-sheet")).toContainText("ตลาดจีน");

  await page.getByRole("button", { name: "เริ่ม" }).click();
  await expect(page).toHaveURL(/\/lesson\/1$/);
});

test("locked nodes stay inert except in the next testable lesson", async ({ page }) => {
  await page.goto("/");

  // Node 2 is locked but shares the current lesson (u1_l1) with node 1, so
  // Phase 4's unlock-test shortcut makes it tappable (see unlock-test.spec.js).
  const eligible = page.getByRole("button", { name: /โหนด 2 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ });
  await expect(eligible).toBeEnabled();

  // Node 6 belongs to a lesson further out - no shortcut reaches that far yet.
  const inert = page.getByRole("button", { name: /โหนด 6 - ล็อค$/ });
  await expect(inert).toBeDisabled();
});

test("the map shows no star counts anywhere - locked/current/cleared is the whole story", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".rm-scroll")).not.toContainText("ดาว");
  await expect(page.locator(".rm-topbar")).not.toContainText("ดาว");
  await expect(page.getByRole("button", { name: /ด่านปัจจุบัน|ผ่านแล้ว|ล็อค/ }).first()).toBeVisible();
});

test("daily reward can be claimed once, adds coins, and persists across reload", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".rm-chip.coins")).toHaveText("0");
  await page.getByRole("button", { name: "เปิดกล่องรางวัลรายวัน" }).click();
  await expect(page.locator(".rm-reward-modal")).toBeVisible();

  await page.getByRole("button", { name: "รับรางวัล" }).click();
  await expect(page.locator(".rm-chip.coins")).toHaveText("10");
  await expect(page.getByRole("button", { name: "รับรางวัลวันนี้แล้ว" })).toBeDisabled();

  await page.reload();
  await expect(page.locator(".rm-chip.coins")).toHaveText("10");
  await expect(page.getByRole("button", { name: "รับรางวัลวันนี้แล้ว" })).toBeDisabled();
});

test("the legacy app is still fully reachable at /classic", async ({ page }) => {
  await page.goto("/classic");
  await expect(page.getByRole("button", { name: "เริ่มการผจญภัย" })).toBeVisible();
});

test("a direct refresh on a deep link does not 404 in dev", async ({ page }) => {
  await page.goto("/lesson/1");
  await expect(page.getByRole("heading", { name: "ตลาดจีน" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "ตลาดจีน" })).toBeVisible();
});
