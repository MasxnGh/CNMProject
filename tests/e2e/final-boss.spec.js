import { expect, test } from "@playwright/test";

test("seeded final boss can be defeated and opens Victory", async ({ page }) => {
  test.setTimeout(60000);
  const levelStars = Object.fromEntries(Array.from({ length: 14 }, (_, index) => [String(index + 1), 3]));
  await page.addInitScript((saved) => window.localStorage.setItem("dujeen-quest-progress", JSON.stringify(saved)), {
    unlockedLevels: [1],
    completedLevels: Object.keys(levelStars).map(Number),
    levelStars,
    totalStars: 42,
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
  await page.locator(".v2-level-island").filter({ hasText: "ด่าน 15" }).click();
  await page.getByRole("button", { name: "เริ่มเล่นเลย" }).click();

  await page.getByRole("button", { name: "新年快乐", exact: true }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await page.getByRole("button", { name: "ü", exact: true }).click();
  await page.locator(".drop-zone").click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();
  await expect(page.getByText("ฟังเสียงเลือกคำ", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "我要去北京。", exact: true }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();
  await expect(page.getByText("เขียนฮั่นจื้อ", { exact: true })).toBeVisible();

  const canvas = page.locator("canvas[aria-label='พื้นที่เขียนตัวอักษรจีน']");
  const box = await canvas.boundingBox();
  for (const points of [
    [[box.x + 10, box.y + 10], [box.x + box.width - 10, box.y + box.height - 10]],
    [[box.x + box.width - 10, box.y + 10], [box.x + 10, box.y + box.height - 10]],
  ]) {
    await page.mouse.move(points[0][0], points[0][1]);
    await page.mouse.down();
    await page.mouse.move(points[1][0], points[1][1], { steps: 20 });
    await page.mouse.up();
  }
  await page.getByRole("button", { name: "ตรวจ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();
  await expect(page.getByText("เรียงประโยค", { exact: true })).toBeVisible();

  const wordBank = page.locator(".word-bank");
  for (const word of ["我", "喜欢", "中国菜"]) {
    await wordBank.getByRole("button", { name: word, exact: true }).click();
  }
  await page.getByRole("button", { name: "ตรวจ" }).click();
  await page.getByRole("button", { name: "ไปต่อ" }).click();

  await expect(page.getByText("ภารกิจสำเร็จ", { exact: true })).toBeVisible();
  const rewardTracks = await page.locator(".v2-reward-grid").evaluate((element) => window.getComputedStyle(element).gridTemplateColumns.split(" ").map(Number.parseFloat));
  expect(rewardTracks).toHaveLength(3);
  await page.getByRole("button", { name: "ไปห้องสมบัติ" }).click();
  await expect(page.getByText("ยินดีด้วย! คุณพิชิตภารกิจ Dujeen Quest สำเร็จแล้ว", { exact: true })).toBeVisible();
});
