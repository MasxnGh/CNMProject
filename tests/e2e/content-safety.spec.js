import { expect, test } from "@playwright/test";

const seed = async (page, levelStars) => {
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress", JSON.stringify(saved)), {
    unlockedLevels: [1],
    completedLevels: Object.keys(levelStars).map(Number),
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
  });
};

const openLevel = async (page, chapterText, levelText) => {
  await page.goto("/");
  await page.getByRole("button", { name: "เริ่มการผจญภัย" }).click();
  const chapter = page.locator("article").filter({ hasText: chapterText });
  await chapter.getByRole("button", { name: "เข้าแผนที่" }).click();
  await page.locator(".v2-level-island").filter({ hasText: levelText }).click();
  await page.getByRole("button", { name: /^เริ่ม$|^เล่นซ้ำ$/ }).click();
  await page.getByRole("button", { name: "เริ่มเล่นเลย" }).click();
};

test("audio mission hides pinyin until after the answer", async ({ page }) => {
  await seed(page, { "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 1, "7": 1, "8": 1 });
  await openLevel(page, "ชีวิตประจำวันและวัฒนธรรมจีน", "ด่าน 9");

  await page.getByRole("button", { name: "a", exact: true }).click();
  await page.locator(".drop-zone").click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();
  await expect(page.getByText("xióngmāo", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "熊猫", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.getByText("xióngmāo", { exact: true })).toBeVisible();
});

test("sentence mission hides the completed Chinese sentence before input", async ({ page }) => {
  const stars = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [String(index + 1), 2]));
  await seed(page, stars);
  await openLevel(page, "บททดสอบขั้นสูงและภารกิจสุดท้าย", "ด่าน 13");

  await expect(page.getByText("我是学生。", { exact: true })).toHaveCount(0);
  await expect(page.getByText("ฉันเป็นนักเรียน", { exact: true })).toBeVisible();
});
