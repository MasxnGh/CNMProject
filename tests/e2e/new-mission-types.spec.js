import { expect, test } from "@playwright/test";

const seedNewProgress = async (page, unlockedNodeId) => {
  await page.addInitScript((nodeId) => window.localStorage.setItem("dujeen-quest-progress-v2", JSON.stringify({
    version: 1,
    completed: [],
    unlocked: [nodeId],
    coins: 0, xp: 0, level: 1, badges: [], levelStars: {}, totalStars: 0,
    streak: { count: 0, lastDate: null },
    unlockTestUsed: {}, mistakes: [], dailyRewardClaimedDate: null,
    soundEnabled: false, reducedMotion: true, skipMissionIntro: true,
  })), unlockedNodeId);
};

test("translationBlank fills the Thai-side gap when the Chinese sentence is fixed", async ({ page }) => {
  await seedNewProgress(page, 13);
  await page.goto("/lesson/13");

  // mission 1 (sentenceOrder, unchanged): our是学生
  await page.locator(".word-chip").filter({ hasText: "我" }).click();
  await page.locator(".word-chip").filter({ hasText: "是" }).click();
  await page.locator(".word-chip").filter({ hasText: "学生" }).click();
  await page.getByRole("button", { name: "ตรวจ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 2 (translationBlank, fixedLang "zh"): fill the Thai gap
  await expect(page.getByText("我喜欢中国菜。", { exact: true })).toBeVisible();
  await expect(page.locator(".translation-blank-line")).toContainText("ฉันชอบ");
  await page.getByRole("button", { name: "อาหารจีน", exact: true }).click();
  await expect(page.locator(".translation-blank-slot")).toHaveText("อาหารจีน");
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 3 (sentenceOrder, now with a "学生" distractor tile mixed in)
  await expect(page.locator(".word-chip").filter({ hasText: "学生" })).toBeVisible();
  await page.locator(".word-chip").filter({ hasText: "他" }).click();
  await page.locator(".word-chip").filter({ hasText: "去" }).click();
  await page.locator(".word-chip").filter({ hasText: "学校" }).click();
  await page.getByRole("button", { name: "ตรวจ" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 4 (translationBlank, fixedLang "th"): fill the Chinese gap
  await expect(page.getByText("นี่คือหนังสือของฉัน", { exact: true })).toBeVisible();
  await expect(page.locator(".translation-blank-line")).toContainText("这是我的");
  await page.getByRole("button", { name: "书", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
});

test("translateSentence accepts either the arranged chips or typed keyboard text", async ({ page }) => {
  await seedNewProgress(page, 10);
  await page.goto("/lesson/10");

  // mission 1 (fillBlank, unchanged)
  await page.getByRole("button", { name: "家", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 2 (translateSentence): switch to keyboard mode and type the answer
  await expect(page.getByText("ฉันรักแม่", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "พิมพ์คำตอบ" }).click();
  await page.getByLabel("พิมพ์คำแปลภาษาจีน").fill("我爱妈妈");
  await page.getByRole("button", { name: "ตรวจ" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
});

test("listen-first sentence order mixes in a distractor tile without blocking the correct answer", async ({ page }) => {
  await seedNewProgress(page, 4);
  await page.goto("/lesson/4");

  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await page.getByRole("button", { name: "yī", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await page.getByRole("button", { name: "明天", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await expect(page.getByText("คุณได้ยินว่าอะไร?", { exact: true })).toBeVisible();
  await expect(page.locator(".word-chip").filter({ hasText: "明天" })).toBeVisible();
  await page.getByRole("button", { name: "ฟังเสียงประโยคช้าๆ" }).click();
  await page.locator(".word-chip").filter({ hasText: "今天" }).click();
  await page.locator(".word-chip").filter({ hasText: "我" }).click();
  await page.locator(".word-chip").filter({ hasText: "喝" }).click();
  await page.locator(".word-chip").filter({ hasText: "茶" }).click();
  await page.getByRole("button", { name: "ตรวจ" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
});
