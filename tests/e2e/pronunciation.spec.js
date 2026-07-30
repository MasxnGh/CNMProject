import { expect, test } from "@playwright/test";

const seedProgress = async (page, unlockedNodeId) => {
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

const mockSpeechRecognition = async (page, transcript) => {
  await page.addInitScript((text) => {
    class FakeSpeechRecognition {
      start() {
        setTimeout(() => this.onresult?.({ results: [[{ transcript: text }]] }), 10);
      }

      stop() {}
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeSpeechRecognition });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeSpeechRecognition });
  }, transcript);
};

const disableSpeechRecognition = async (page) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
  });
};

const playThroughFirstThreeMissions = async (page) => {
  // mission 1 (shopping, unchanged)
  await page.locator(".shop-item").filter({ hasText: "càidān" }).click();
  await page.locator(".shop-item").filter({ hasText: "mǐfàn" }).click();
  await page.getByRole("button", { name: "ตรวจรายการ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 2 (dialogue, unchanged)
  await page.getByRole("button", { name: "多少钱？", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 3 (fillBlank, unchanged)
  await page.getByRole("button", { name: "这个", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();
};

test("a matching transcript from the mic passes the pronunciation mission", async ({ page }) => {
  await mockSpeechRecognition(page, "好吃");
  await seedProgress(page, 6);
  await page.goto("/lesson/6");

  await playThroughFirstThreeMissions(page);

  // mission 4 (pronunciation, new)
  await expect(page.getByText("好吃", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "กดเพื่อพูด" }).click();
  await expect(page.getByText(/ระบบได้ยินว่า/)).toBeVisible();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
});

test("falls back to a self-report confirmation when the browser cannot recognize speech", async ({ page }) => {
  await disableSpeechRecognition(page);
  await seedProgress(page, 6);
  await page.goto("/lesson/6");

  await playThroughFirstThreeMissions(page);

  await expect(page.getByText("好吃", { exact: true })).toBeVisible();
  await expect(page.getByText(/ไม่รองรับการฟังเสียงพูด/)).toBeVisible();
  await page.getByRole("button", { name: "ฉันพูดแล้ว" }).click();
  await expect(page.locator(".v2-verdict").getByText("ถูกต้อง", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // mission 5 (matching, unchanged) - proves the lesson keeps running after the fallback path
  const pairs = [["菜单", "เมนู"], ["好吃", "อร่อย"], ["多少钱？", "ราคาเท่าไหร่"], ["我要这个。", "ฉันเอาอันนี้"], ["米饭", "ข้าว"]];
  for (const [hanzi, thai] of pairs) {
    await page.locator(".match-item").filter({ hasText: hanzi }).click();
    await page.locator(".match-answer").filter({ hasText: thai }).click();
  }
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await expect(page).toHaveURL(/\/result\/6$/);
});
