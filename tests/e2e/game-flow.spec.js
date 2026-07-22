import { expect, test } from "@playwright/test";

const progressKey = "dujeen-quest-progress";

const seedProgress = async (page, levelStars = {}) => {
  const completedLevels = Object.keys(levelStars).map(Number).sort((a, b) => a - b);
  await page.addInitScript(({ key, saved }) => {
    window.localStorage.setItem(key, JSON.stringify(saved));
  }, {
    key: progressKey,
    saved: {
      unlockedLevels: [1],
      completedLevels,
      levelStars,
      totalStars: Object.values(levelStars).reduce((sum, value) => sum + value, 0),
      xp: 0,
      level: 1,
      coins: 0,
      badges: [],
      unlockedKnowledge: [],
      lastPlayedLevel: 1,
      soundEnabled: false,
      reducedMotion: true,
      skipMissionIntro: false,
    },
  });
};

test("loads home, opens chapter map, and starts the first mission", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/");

  const startButton = page.getByRole("button", { name: "เริ่มการผจญภัย" });
  await expect(startButton).toBeVisible({ timeout: 7000 });
  await startButton.click();
  await expect(page.getByRole("heading", { name: "เลือกประตูภารกิจ" })).toBeVisible();

  const firstChapter = page.locator("article").filter({ hasText: "เริ่มต้นผจญภัยในเมืองจีน" });
  await expect(firstChapter).toHaveCount(1);
  const mapButton = firstChapter.getByRole("button", { name: "เข้าแผนที่" });
  await expect(mapButton).toBeEnabled();
  await mapButton.click();

  const firstLevel = page.locator(".v2-level-island").filter({ hasText: "ด่าน 1" });
  await expect(firstLevel).toHaveCount(1);
  await firstLevel.click();
  await expect(page.getByRole("button", { name: "Start Mission" })).toBeVisible();
});

test("keeps locked chapters unavailable", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/");
  await page.getByRole("button", { name: "เริ่มการผจญภัย" }).click();

  const secondChapter = page.locator("article").filter({ hasText: "ชีวิตประจำวันและวัฒนธรรมจีน" });
  await expect(secondChapter).toHaveCount(1);
  await expect(secondChapter.getByRole("button", { name: "เข้าแผนที่" })).toBeDisabled();
  await expect(secondChapter).toContainText("ต้องมี 8 ดาว");
});

test("shows the pinyin pattern without the full answer before input", async ({ page }) => {
  await seedProgress(page, { "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 1, "7": 1, "8": 1 });
  await page.goto("/");
  await page.getByRole("button", { name: "เริ่มการผจญภัย" }).click();
  const secondChapter = page.locator("article").filter({ hasText: "ชีวิตประจำวันและวัฒนธรรมจีน" });
  await secondChapter.getByRole("button", { name: "เข้าแผนที่" }).click();
  await page.locator(".v2-level-island").filter({ hasText: "ด่าน 9" }).click();
  await page.getByRole("button", { name: "Start Mission" }).click();

  await expect(page.locator(".pinyin-pattern")).toHaveText("m _ o");
  await expect(page.getByText("māo", { exact: true })).toHaveCount(0);
});
