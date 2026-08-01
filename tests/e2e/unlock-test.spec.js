import { expect, test } from "@playwright/test";

// Chapter 1 (แนะนำตัวเอง) is ch1_l1 covering nodes [2, 3] - the default fresh
// progress already has node 2 unlocked and node 3 locked in the same lesson,
// so no seeding is needed to reach the checkpoint offer on node 3.
const seedProgress = async (page, overrides = {}) => {
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress-v2", JSON.stringify(saved)), {
    version: 1,
    completed: [], unlocked: [2],
    coins: 0, xp: 0, level: 1, badges: [], levelStars: {}, totalStars: 0,
    streak: { count: 0, lastDate: null },
    unlockTestUsed: {}, clearedCheckpoints: [], mistakes: [], dailyRewardClaimedDate: null,
    soundEnabled: false, reducedMotion: true, skipMissionIntro: true,
    ...overrides,
  });
};

const submit = (page) => page.getByRole("button", { name: /^(ตรวจคำตอบ|ตรวจ|ตรวจรายการ)$/ }).click();
const next = (page) => page.getByRole("button", { name: "ไปต่อ" }).click();
// pinyinDrag has two elements that can show the same text (the drop-zone
// once a value is selected, and the draggable chip itself) - scope to the
// chip specifically, and click it twice (select, then submit - it has no
// separate "ตรวจคำตอบ" button).
const pickAndDropChip = async (page, value) => {
  const chip = page.locator(".vowel-chip").filter({ hasText: value });
  await chip.click();
  await chip.click();
};

test("passing the unlock test opens both nodes in the lesson at once, with a bonus and a badge", async ({ page }) => {
  test.setTimeout(30000);
  await seedProgress(page);
  await page.goto("/chapter/ch1");

  await page.getByRole("button", { name: /โหนด 3 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ }).click();
  await expect(page.locator(".ln-sheet")).toContainText("บทที่ 1");
  await page.getByRole("button", { name: "เริ่มทำแบบทดสอบ" }).click();
  await expect(page).toHaveURL(/\/unlock\/ch1_l1$/);
  await expect(page.locator(".v2-mission-progress.checkpoint")).toBeVisible();

  // 1. 2-1 pinyinDrag (auto-submits on the second tap, no separate submit button)
  await pickAndDropChip(page, "ǐ");
  await next(page);
  // 2. 3-1 sentenceOrder: 你好
  await page.locator(".word-chip").filter({ hasText: "你" }).click();
  await page.locator(".word-chip").filter({ hasText: "好" }).click();
  await submit(page);
  await next(page);
  // 3. 2-2 toneChoice: lǎo
  await page.getByRole("button", { name: "lǎo", exact: true }).click();
  await submit(page);
  await next(page);
  // 4. 3-2 dialogue: 你叫什么名字？
  await page.getByRole("button", { name: "你叫什么名字？", exact: true }).click();
  await submit(page);
  await next(page);
  // 5. 2-3 audioChoice: 谢谢
  await page.getByRole("button", { name: "谢谢", exact: true }).click();
  await submit(page);
  await next(page);
  // 6. 3-4 fillBlank: 认识 (spreadByType moves node 3's second sentenceOrder
  // question to the end of its group, so this round is the fillBlank one)
  await page.getByRole("button", { name: "认识", exact: true }).click();
  await submit(page);
  await next(page);
  // 7. 2-4 pinyinDrag: ai
  await pickAndDropChip(page, "ai");
  await next(page);
  // 8. 3-5 audioChoice: 再见！
  await page.getByRole("button", { name: "再见！", exact: true }).click();
  await submit(page);
  await next(page);
  // 9. 2-5 toneChoice: xuéshēng
  await page.getByRole("button", { name: "xuéshēng", exact: true }).click();
  await submit(page);
  await next(page);
  // 10. 3-3 sentenceOrder: 我叫小明
  await page.locator(".word-chip").filter({ hasText: "我" }).click();
  await page.locator(".word-chip").filter({ hasText: "叫" }).click();
  await page.locator(".word-chip").filter({ hasText: "小明" }).click();
  await submit(page);
  await next(page);

  await expect(page).toHaveURL(/\/result\/checkpoint-ch1_l1$/);
  await expect(page.getByText("ปลดล็อค 2 ด่านพร้อมกัน!", { exact: true })).toBeVisible();
  await expect(page.getByText("ผู้ข้ามด่าน", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "กลับแผนที่" }).click();
  await expect(page).toHaveURL(/\/chapter\/ch1$/);
  await expect(page.locator(".ln-lamp.done")).toHaveCount(2);
  const coins = await page.evaluate(() => JSON.parse(localStorage.getItem("dujeen-quest-progress-v2")).coins);
  expect(coins).toBeGreaterThan(0);
});

test("failing the unlock test (3 wrong) does not unlock anything and points at the weakest node", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/chapter/ch1");

  await page.getByRole("button", { name: /โหนด 3 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ }).click();
  await page.getByRole("button", { name: "เริ่มทำแบบทดสอบ" }).click();

  // Answer the first 3 wrong on purpose - hearts run out, run ends immediately.
  await pickAndDropChip(page, "í");
  await next(page);
  await page.locator(".word-chip").filter({ hasText: "好" }).click();
  await page.locator(".word-chip").filter({ hasText: "你" }).click();
  await submit(page);
  await next(page);
  await page.getByRole("button", { name: "láo", exact: true }).click();
  await submit(page);
  await next(page);

  await expect(page).toHaveURL(/\/result\/checkpoint-ch1_l1$/);
  await expect(page.getByText("ยังไม่ปลดล็อค", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "กลับแผนที่" }).click();
  await expect(page.locator(".ln-lamp.done")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /โหนด 3 - ล็อค/ })).toBeVisible();
});

test("once today's free attempt is used, the offer switches to paying coins to unlock directly", async ({ page }) => {
  await seedProgress(page, { coins: 100, unlockTestUsed: { ch1_l1: new Date().toISOString().slice(0, 10) } });
  await page.goto("/chapter/ch1");

  await page.getByRole("button", { name: /โหนด 3 - ล็อค - ทำแบบทดสอบข้ามด่านได้/ }).click();
  await expect(page.getByText("ใช้สิทธิ์ทำแบบทดสอบวันนี้ไปแล้ว", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: /จ่าย 50 เหรียญ ปลดล็อคทันที/ }).click();
  await expect(page.locator(".ln-lamp.done")).toHaveCount(0);
  await expect(page.locator(".ln-lamp.now")).toHaveCount(2);

  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("dujeen-quest-progress-v2")).coins)).toBe(50);
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

  await expect(page).toHaveURL("/chapters");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("dujeen-quest-progress-v2")).mistakes);
  expect(stored).toEqual([]);
});
