import { expect, test } from "@playwright/test";

// Phase 3 pilot: chapter 4 (ประเทศและภาษา) is the one chapter authored at the
// doc's full depth (10 questions per node instead of 5). This plays node 16
// (บทที่ 1 of ch4_l1) end-to-end to prove the bigger format works, then
// checks the chapter path reflects the new node as cleared.
const seedProgress = async (page, overrides = {}) => {
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress-v2", JSON.stringify(saved)), {
    version: 1,
    completed: [], unlocked: [16],
    coins: 0, xp: 0, level: 1, badges: [], levelStars: {}, totalStars: 0,
    streak: { count: 0, lastDate: null },
    unlockTestUsed: {}, clearedCheckpoints: [], mistakes: [], dailyRewardClaimedDate: null,
    soundEnabled: false, reducedMotion: true, skipMissionIntro: true,
    ...overrides,
  });
};

const submit = (page) => page.getByRole("button", { name: /^(ตรวจคำตอบ|ตรวจ|ตรวจรายการ)$/ }).click();
const next = (page) => page.getByRole("button", { name: "ไปต่อ" }).click();

test("chapter 4's first node plays all 10 full-depth missions and unlocks the next node", async ({ page }) => {
  test.setTimeout(30000);
  await seedProgress(page);
  await page.goto("/lesson/16");

  // The lantern-district lesson screen always starts immediately with no
  // "เริ่มเล่นเลย" intro screen at all.
  await expect(page.locator(".ln-quiz-progress")).toBeVisible();

  // 1. multipleChoice: 泰国 = ประเทศไทย
  await page.getByRole("button", { name: "ประเทศไทย", exact: true }).click();
  await submit(page);
  await next(page);
  // 2. multipleChoice: 中国 = ประเทศจีน
  await page.getByRole("button", { name: "ประเทศจีน", exact: true }).click();
  await submit(page);
  await next(page);
  // 3. toneChoice: 人 = rén
  await page.getByRole("button", { name: "rén", exact: true }).click();
  await submit(page);
  await next(page);
  // 4. audioChoice: 泰国人
  await page.getByRole("button", { name: "泰国人", exact: true }).click();
  await submit(page);
  await next(page);
  // 5. matching: 5 pairs. 泰国/中国/人 are prefixes or suffixes of 泰国人/
  // 中国人 in the same tile text (and คน is a prefix of คนไทย/คนจีน), so
  // match the exact token rather than a loose substring.
  const exactToken = (text, scriptRange) => new RegExp(`(?<![${scriptRange}])${text}(?![${scriptRange}])`, "u");
  const exactHanzi = (hanzi) => exactToken(hanzi, "\\u4e00-\\u9fff");
  const exactThai = (thai) => exactToken(thai, "\\u0e00-\\u0e7f");
  const pairs = [["泰国", "ประเทศไทย"], ["中国", "ประเทศจีน"], ["人", "คน"], ["泰国人", "คนไทย"], ["中国人", "คนจีน"]];
  for (const [hanzi, thai] of pairs) {
    await page.locator(".match-item").filter({ hasText: exactHanzi(hanzi) }).click();
    await page.locator(".match-answer").filter({ hasText: exactThai(thai) }).click();
  }
  await submit(page);
  await next(page);
  // 6. imageChoice: 泰国 -> ประเทศไทย
  await page.getByRole("button", { name: "ประเทศไทย", exact: true }).click();
  await submit(page);
  await next(page);
  // 7. fillBlank: 我是____人。 -> 泰国
  await page.getByRole("button", { name: "泰国", exact: true }).click();
  await submit(page);
  await next(page);
  // 8. sentenceOrder: 我是泰国人
  await page.locator(".word-chip").filter({ hasText: "我" }).click();
  await page.locator(".word-chip").filter({ hasText: "是" }).click();
  await page.locator(".word-chip").filter({ hasText: "泰国人" }).click();
  await submit(page);
  await next(page);
  // 9. dialogue: 你是哪国人？-> 我是泰国人。
  await page.getByRole("button", { name: "我是泰国人。", exact: true }).click();
  await submit(page);
  await next(page);
  // 10. translationBlank: 我是中国人。-> ฉันเป็น___ -> คนจีน
  await page.getByRole("button", { name: "คนจีน", exact: true }).click();
  await submit(page);
  await next(page);

  await expect(page).toHaveURL(/\/result\/16$/);
  await expect(page.getByText("ตอบถูก", { exact: false })).toBeVisible();

  // Client-side navigation (a button click), not page.goto() - goto() is a
  // real browser navigation, which re-fires addInitScript and would reset
  // localStorage right back to this test's seed, wiping the progress just
  // earned.
  await page.getByRole("button", { name: "กลับแผนที่" }).click();
  await expect(page).toHaveURL(/\/chapter\/ch4$/);
  await expect(page.locator(".ln-lamp.done")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /โหนด 17 - ด่านปัจจุบัน/ })).toBeVisible();
});

test("the chapter grid shows chapter 4 as a live chapter, not a draft", async ({ page }) => {
  await page.goto("/chapters");
  await expect(page.getByRole("button", { name: /ประเทศและภาษา/ })).not.toContainText("เร็วๆ นี้");
});
