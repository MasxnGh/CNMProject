/**
 * Structural integrity check for src/content/*.json + public/img/vocab/.
 * Run via `npm run validate`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src/content");
const imgDir = path.join(root, "public/img/vocab");
const readJson = (name) => JSON.parse(readFileSync(path.join(contentDir, name), "utf8"));

const categories = readJson("categories.json");
const vocab = readJson("vocab.json");
const config = readJson("config.json");

const errors = [];
const warnings = [];

const catIds = new Set(categories.map((c) => c.id));

// id uniqueness
const seenIds = new Map();
for (const w of vocab) {
  if (seenIds.has(w.id)) {
    errors.push(`id ซ้ำ: "${w.id}" (${seenIds.get(w.id)} และ "${w.hanzi}")`);
  } else {
    seenIds.set(w.id, w.hanzi);
  }
}

// cat exists
for (const w of vocab) {
  if (!catIds.has(w.cat)) {
    errors.push(`คำ "${w.hanzi}" (${w.id}) อ้างหมวด "${w.cat}" ที่ไม่มีอยู่ใน categories.json`);
  }
}

// art file exists for every non-empty art key
const usedArtKeys = new Set();
for (const w of vocab) {
  if (w.art) {
    usedArtKeys.add(w.art);
    const file = path.join(imgDir, `${w.art}.webp`);
    if (!existsSync(file)) {
      errors.push(`คำ "${w.hanzi}" (${w.id}) อ้างภาพ "${w.art}.webp" แต่ไม่มีไฟล์จริงใน public/img/vocab/`);
    }
  }
}

// orphan images: files in public/img/vocab not referenced by any word
if (existsSync(imgDir)) {
  const files = readdirSync(imgDir).filter((f) => f.endsWith(".webp"));
  for (const f of files) {
    const key = f.replace(/\.webp$/, "");
    if (!usedArtKeys.has(key)) {
      warnings.push(`ไฟล์ภาพ "${f}" ไม่มีคำไหนในคลังใช้ (orphan)`);
    }
  }
} else {
  warnings.push(`ไม่พบโฟลเดอร์ public/img/vocab/`);
}

// every category has >= 4 words
const countByCategory = new Map(categories.map((c) => [c.id, { total: 0, withArt: 0 }]));
for (const w of vocab) {
  const bucket = countByCategory.get(w.cat);
  if (!bucket) continue;
  bucket.total++;
  if (w.art) bucket.withArt++;
}
for (const c of categories) {
  const bucket = countByCategory.get(c.id);
  if (bucket.total < 4) {
    errors.push(`หมวด "${c.id}" (${c.th}) มีคำแค่ ${bucket.total} คำ ต้องมีอย่างน้อย 4 คำ`);
  }
}

// sequences: cat must exist, every item must belong to that cat
const vocabByHanzi = new Map(vocab.map((w) => [w.hanzi, w]));
config.sequences.forEach((seq, si) => {
  if (!catIds.has(seq.cat)) {
    errors.push(`sequences[${si}] อ้างหมวด "${seq.cat}" ที่ไม่มีอยู่ใน categories.json`);
    return;
  }
  for (const item of seq.items) {
    const w = vocabByHanzi.get(item.hanzi);
    if (!w) {
      errors.push(`sequences[${si}] คำ "${item.hanzi}" ไม่มีอยู่ใน vocab.json`);
    } else if (w.cat !== seq.cat) {
      errors.push(`sequences[${si}] คำ "${item.hanzi}" อยู่หมวด "${w.cat}" แต่ sequence กำกับหมวด "${seq.cat}"`);
    }
  }
});

// ── report table ──
console.log("\nหมวด            จำนวนคำ   มีภาพ");
console.log("─".repeat(38));
for (const c of categories) {
  const bucket = countByCategory.get(c.id);
  console.log(
    `${(c.id + " " + c.zh).padEnd(16)} ${String(bucket.total).padStart(7)}   ${String(bucket.withArt).padStart(5)}`,
  );
}
const totalWords = vocab.length;
const totalWithArt = vocab.filter((w) => w.art).length;
console.log("─".repeat(38));
console.log(`${"รวม".padEnd(16)} ${String(totalWords).padStart(7)}   ${String(totalWithArt).padStart(5)}\n`);

if (warnings.length) {
  console.log(`คำเตือน (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log("");
}

if (errors.length) {
  console.log(`ข้อผิดพลาด (${errors.length}):`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log("");
  process.exit(1);
}

console.log(`ผ่านทุกข้อ — ${totalWords} คำ, ${categories.length} หมวด, ${totalWithArt} คำมีภาพ`);
