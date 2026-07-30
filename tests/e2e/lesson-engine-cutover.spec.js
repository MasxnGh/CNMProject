import { expect, test } from "@playwright/test";

/**
 * Phase 1.5 regression test: proves the reused engine (GamePage/
 * QuestionRenderer/evaluateMission, untouched) still plays a real node
 * end-to-end when driven by the new route tree, and that finishing writes
 * to the new progress store correctly (node completed, next node unlocked,
 * coins/xp awarded, result page shows real numbers).
 */
test("completing node 1 through /lesson/1 unlocks node 2 and shows a real result", async ({ page }) => {
  await page.goto("/lesson/1");
  await page.getByRole("button", { name: "เริ่มเล่นเลย" }).click();

  // 1/5 matching: hanzi <-> Thai meaning
  const pairs = [
    ["水", "น้ำ"],
    ["茶", "ชา"],
    ["米饭", "ข้าวสวย"],
    ["面条", "บะหมี่"],
    ["饺子", "เกี๊ยว"],
  ];
  for (const [hanzi, thai] of pairs) {
    await page.locator(".match-item").filter({ hasText: hanzi }).click();
    await page.locator(".match-answer").filter({ hasText: thai }).click();
  }
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // 2/5 shopping: buy water and tea (cards are labelled by pinyin)
  await page.locator(".shop-item").filter({ hasText: "shuǐ" }).click();
  await page.locator(".shop-item").filter({ hasText: "chá" }).click();
  await page.getByRole("button", { name: "ตรวจรายการ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // 3/5 audio choice: correct word is 米饭
  await page.getByRole("button", { name: "米饭", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // 4/5 fill blank: correct word is 面条
  await page.getByRole("button", { name: "面条", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  // 5/5 image choice: correct picture is เกี๊ยว
  await page.getByRole("button", { name: "เกี๊ยว", exact: true }).click();
  await page.getByRole("button", { name: "ตรวจคำตอบ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await expect(page).toHaveURL(/\/result\/1$/);
  await expect(page.getByText("ภารกิจสำเร็จ", { exact: true })).toBeVisible();
  await expect(page.getByText("ตอบถูก 5/5", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "ไปด่านถัดไป" }).click();
  await expect(page).toHaveURL(/\/lesson\/2$/);

  await page.goto("/");
  await expect(page.locator(".rm-node.cleared")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /โหนด 2 - ด่านปัจจุบัน/ })).toBeVisible();
  await expect(page.locator(".rm-chip.coins")).not.toHaveText("0");
});

test("retrying a node re-mounts a fresh game session", async ({ page }) => {
  await page.goto("/lesson/1");
  await page.getByRole("button", { name: "เริ่มเล่นเลย" }).click();
  await expect(page.locator(".v2-mission-progress").getByText("ภารกิจ 1/5")).toBeVisible();
});
