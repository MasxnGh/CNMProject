import { expect, test } from "@playwright/test";

test("reset progress requires the in-game confirmation modal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "เริ่มใหม่" })).toBeVisible({ timeout: 7000 });
  await page.getByRole("button", { name: "เริ่มใหม่" }).click();
  await expect(page.getByText("ต้องการเริ่มผจญภัยใหม่หรือไม่?", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ยืนยัน" })).toBeVisible();
  await page.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(page.getByText("ต้องการเริ่มผจญภัยใหม่หรือไม่?", { exact: true })).toHaveCount(0);
});

test("Hanzi mission exposes a real canvas and drawing controls", async ({ page }) => {
  const levelStars = Object.fromEntries(Array.from({ length: 11 }, (_, index) => [String(index + 1), 2]));
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress", JSON.stringify(saved)), {
    unlockedLevels: [1],
    completedLevels: Object.keys(levelStars).map(Number),
    levelStars,
    totalStars: 22,
    xp: 0,
    level: 1,
    coins: 0,
    badges: [],
    unlockedKnowledge: [],
    lastPlayedLevel: 1,
    soundEnabled: false,
    reducedMotion: true,
    skipMissionIntro: false,
  });
  await page.goto("/");
  await page.getByRole("button", { name: "เริ่มการผจญภัย" }).click();
  await page.locator("article").filter({ hasText: "บททดสอบขั้นสูงและภารกิจสุดท้าย" }).getByRole("button", { name: "เข้าแผนที่" }).click();
  await page.locator(".v2-level-island").filter({ hasText: "ด่าน 12" }).click();
  await page.getByRole("button", { name: "Start Mission" }).click();

  await expect(page.locator("canvas[aria-label='พื้นที่เขียนตัวอักษรจีน']")).toBeVisible();
  await expect(page.getByRole("button", { name: "ตรวจ" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "ล้าง" })).toBeDisabled();
});
