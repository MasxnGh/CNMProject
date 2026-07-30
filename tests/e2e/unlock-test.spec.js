import { expect, test } from "@playwright/test";

const seedProgress = async (page, overrides = {}) => {
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress-v2", JSON.stringify(saved)), {
    version: 1,
    completed: [1, 2, 3],
    unlocked: [1, 2, 3],
    coins: 0, xp: 0, level: 1, badges: [], levelStars: { 1: 1, 2: 1, 3: 1 }, totalStars: 3,
    streak: { count: 0, lastDate: null },
    unlockTestUsed: {}, clearedCheckpoints: [], mistakes: [], dailyRewardClaimedDate: null,
    soundEnabled: false, reducedMotion: true, skipMissionIntro: true,
    ...overrides,
  });
};

const submit = (page) => page.getByRole("button", { name: /^(ตรวจคำตอบ|ตรวจ|ตรวจรายการ)$/ }).click();
const next = (page) => page.getByRole("button", { name: "ไปต่อ" }).click();

test("passing the unlock test opens both nodes in the lesson at once, with a bonus and a badge", async ({ page }) => {
  test.setTimeout(30000);
  await seedProgress(page);
  await page.goto("/");

  await page.getByRole("button", { name: /โหนด 4 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ }).click();
  await expect(page.locator(".rm-sheet")).toContainText("บทที่ 2");
  await page.getByRole("button", { name: "เริ่มทำแบบทดสอบ" }).click();
  await expect(page).toHaveURL(/\/unlock\/u1_l2$/);
  await expect(page.locator(".v2-mission-progress.checkpoint")).toBeVisible();

  // 1. 4-1 multipleChoice: 3
  await page.getByRole("button", { name: "3", exact: true }).click();
  await submit(page);
  await next(page);
  // 2. 5-1 multipleChoice
  await page.getByRole("button", { name: "我要去北京。", exact: true }).click();
  await submit(page);
  await next(page);
  // 3. 4-2 toneChoice
  await page.getByRole("button", { name: "yī", exact: true }).click();
  await submit(page);
  await next(page);
  // 4. 5-2 audioChoice
  await page.getByRole("button", { name: "火车", exact: true }).click();
  await submit(page);
  await next(page);
  // 5. 4-3 fillBlank
  await page.getByRole("button", { name: "明天", exact: true }).click();
  await submit(page);
  await next(page);
  // 6. 5-3 matching
  const pairs = [["火车", "รถไฟ"], ["飞机", "เครื่องบิน"], ["车站", "สถานี"], ["票", "ตั๋ว"]];
  for (const [hanzi, thai] of pairs) {
    await page.locator(".match-item").filter({ hasText: hanzi }).click();
    await page.locator(".match-answer").filter({ hasText: thai }).click();
  }
  await submit(page);
  await next(page);
  // 7. 4-4 sentenceOrder (listen-first, with a "明天" decoy in the tray)
  await page.locator(".word-chip").filter({ hasText: "今天" }).click();
  await page.locator(".word-chip").filter({ hasText: "我" }).click();
  await page.locator(".word-chip").filter({ hasText: "喝" }).click();
  await page.locator(".word-chip").filter({ hasText: "茶" }).click();
  await submit(page);
  await next(page);
  // 8. 5-4 fillBlank
  await page.getByRole("button", { name: "北京", exact: true }).click();
  await submit(page);
  await next(page);
  // 9. 4-5 audioChoice
  await page.getByRole("button", { name: "十", exact: true }).click();
  await submit(page);
  await next(page);
  // 10. 5-5 shopping
  await page.locator(".shop-item").filter({ hasText: "huǒchē" }).click();
  await page.locator(".shop-item").filter({ hasText: "piào" }).click();
  await submit(page);
  await next(page);

  await expect(page).toHaveURL(/\/result\/checkpoint-u1_l2$/);
  await expect(page.getByText("ปลดล็อค 2 ด่านพร้อมกัน!", { exact: true })).toBeVisible();
  await expect(page.getByText("ผู้ข้ามด่าน", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "กลับแผนที่" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".rm-node.cleared")).toHaveCount(5);
  await expect(page.locator(".rm-chip.coins")).not.toHaveText("0");
});

test("failing the unlock test (3 wrong) does not unlock anything and points at the weakest node", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/");

  await page.getByRole("button", { name: /โหนด 4 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ }).click();
  await page.getByRole("button", { name: "เริ่มทำแบบทดสอบ" }).click();

  // Answer the first 3 wrong on purpose - hearts run out, run ends immediately.
  await page.getByRole("button", { name: "1", exact: true }).click();
  await submit(page);
  await next(page);
  await page.getByRole("button", { name: "谢谢。", exact: true }).click();
  await submit(page);
  await next(page);
  await page.getByRole("button", { name: "yí", exact: true }).click();
  await submit(page);
  await next(page);

  await expect(page).toHaveURL(/\/result\/checkpoint-u1_l2$/);
  await expect(page.getByText("ยังไม่ปลดล็อค", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "กลับแผนที่" }).click();
  await expect(page.locator(".rm-node.cleared")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /โหนด 4 - ล็อค/ })).toBeVisible();
});

test("once today's free attempt is used, the offer switches to paying coins to unlock directly", async ({ page }) => {
  await seedProgress(page, { coins: 100, unlockTestUsed: { u1_l2: new Date().toISOString().slice(0, 10) } });
  await page.goto("/");

  await page.getByRole("button", { name: /โหนด 4 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ }).click();
  await expect(page.getByText("ใช้สิทธิ์ทำแบบทดสอบวันนี้ไปแล้ว", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: /จ่าย 50 เหรียญ ปลดล็อคทันที/ }).click();
  await expect(page.locator(".rm-node.cleared")).toHaveCount(3);
  await expect(page.locator(".rm-chip.coins")).toHaveText("50");
  await expect(page.getByRole("button", { name: /โหนด 4 - ด่านปัจจุบัน/ })).toBeVisible();
});

test("practice tab replays mistakes and clears the ones answered correctly", async ({ page }) => {
  await seedProgress(page, { mistakes: ["1-1"] });
  await page.goto("/practice");

  await expect(page.getByText("ทบทวน 1 ข้อที่เคยพลาด", { exact: false })).toBeVisible();
  const pairs = [["水", "น้ำ"], ["茶", "ชา"], ["米饭", "ข้าวสวย"], ["面条", "บะหมี่"], ["饺子", "เกี๊ยว"]];
  for (const [hanzi, thai] of pairs) {
    await page.locator(".match-item").filter({ hasText: hanzi }).click();
    await page.locator(".match-answer").filter({ hasText: thai }).click();
  }
  await submit(page);
  await next(page);

  await expect(page).toHaveURL("/");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("dujeen-quest-progress-v2")).mistakes);
  expect(stored).toEqual([]);
});
