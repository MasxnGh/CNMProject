import { expect, test } from "@playwright/test";

test("the chapter grid shows the first chapter available and the rest locked or draft", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: /แนะนำตัวเอง/ })).toBeEnabled();
  // ch4/ch5/ch8/ch10 are drafts ("เร็วๆ นี้"); every other later chapter is
  // simply locked until the player reaches it.
  await expect(page.getByText("เร็วๆ นี้").first()).toBeVisible();
  await expect(page.getByText("ยังไม่ปลดล็อค").first()).toBeVisible();
});

test("a chapter's own path shows its first node unlocked and the rest locked", async ({ page }) => {
  await page.goto("/chapter/ch1");

  await expect(page.locator(".rm-node")).toHaveCount(2);
  await expect(page.locator(".rm-node.current")).toHaveCount(1);
  await expect(page.locator(".rm-node.locked")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /โหนด 2 - ด่านปัจจุบัน/ })).toBeVisible();
});

test("tapping the current node opens a start sheet and starting it navigates to the lesson route", async ({ page }) => {
  // The current node bounces continuously to draw attention (disabled under
  // prefers-reduced-motion), which otherwise never lets Playwright's
  // actionability check see it as "stable" long enough to click.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/chapter/ch1");

  await page.getByRole("button", { name: /โหนด 2 - ด่านปัจจุบัน/ }).click();
  await expect(page.locator(".rm-sheet")).toBeVisible();
  await expect(page.locator(".rm-sheet")).toContainText("ร้านชาโบราณ");

  await page.getByRole("button", { name: "เริ่ม" }).click();
  await expect(page).toHaveURL(/\/lesson\/2$/);
});

test("locked nodes stay inert except in the next testable lesson", async ({ page }) => {
  // Node 3 is locked but shares chapter 1's only lesson with node 2 (the
  // current node), so Phase 4's unlock-test shortcut makes it tappable.
  await page.goto("/chapter/ch1");
  const eligible = page.getByRole("button", { name: /โหนด 3 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ });
  await expect(eligible).toBeEnabled();

  // Chapter 2's node belongs to a lesson further out - no shortcut reaches
  // that far yet.
  await page.goto("/chapter/ch2");
  const inert = page.getByRole("button", { name: /โหนด 4 - ล็อค$/ });
  await expect(inert).toBeDisabled();
});

test("the map shows no star counts anywhere - locked/current/cleared is the whole story", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".rm-scroll")).not.toContainText("ดาว");
  await expect(page.locator(".rm-topbar")).not.toContainText("ดาว");

  await page.goto("/chapter/ch1");
  await expect(page.locator(".rm-scroll")).not.toContainText("ดาว");
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
