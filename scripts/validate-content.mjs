/**
 * Structural integrity check for src/content/*.json + public/img/vocab/.
 * Run via `npm run validate`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { isEmojiArt } from "../src/lib/art.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src/content");
const imgDir = path.join(root, "public/img/vocab");
const readJson = (name) => JSON.parse(readFileSync(path.join(contentDir, name), "utf8"));

const categories = readJson("categories.json");
const vocab = readJson("vocab.json");
const config = readJson("config.json");

const errors = [];
const warnings = [];

// Words with no picture at all — every one is here because a picture would be
// actively misleading (abstract copula/existential verbs, directional 来/去 that
// look identical without context, question words, bare measure words). Any word
// not on this list MUST have art: sharing another word's picture ("borrowing")
// is not an allowed way to get around that — see the art-uniqueness check below.
const TEXT_ONLY_IDS = new Set([
  "v_kuai", "v_ge", "v_shi2", "v_you", "v_jiao2", "v_lai", "v_qu", "v_hao2",
  "v_shenme", "v_shei", "v_nar", "v_ji", "v_duoshao", "v_zenme", "v_zenmeyang", "v_weishenme",
]);

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

// art file exists for every non-empty art key (emoji values render directly, no file needed)
const usedArtKeys = new Set();
for (const w of vocab) {
  if (w.art && !isEmojiArt(w.art)) {
    usedArtKeys.add(w.art);
    const file = path.join(imgDir, `${w.art}.webp`);
    if (!existsSync(file)) {
      errors.push(`คำ "${w.hanzi}" (${w.id}) อ้างภาพ "${w.art}.webp" แต่ไม่มีไฟล์จริงใน public/img/vocab/`);
    }
  }
}

// every word either has its own picture or is explicitly declared text-only —
// no silent "forgot to add art" and no quietly borrowing someone else's picture
for (const w of vocab) {
  if (!w.art && !TEXT_ONLY_IDS.has(w.id)) {
    errors.push(`คำ "${w.hanzi}" (${w.id}) ไม่มี art และไม่ได้อยู่ใน TEXT_ONLY_IDS ที่ประกาศไว้ (validate-content.mjs)`);
  }
  if (w.art && TEXT_ONLY_IDS.has(w.id)) {
    errors.push(`คำ "${w.hanzi}" (${w.id}) อยู่ใน TEXT_ONLY_IDS แต่กลับมี art "${w.art}" — เอาออกจากลิสต์หรือลบ art อันใดอันหนึ่ง`);
  }
}

// no two words may share one picture — two different words showing the same
// image is exactly the "borrowing" pattern this validator exists to prevent
{
  const owners = new Map();
  for (const w of vocab) {
    if (!w.art) continue;
    const prior = owners.get(w.art);
    if (prior) {
      errors.push(`คำ "${w.hanzi}" (${w.id}) กับ "${prior.hanzi}" (${prior.id}) ใช้ art "${w.art}" ร่วมกัน — ห้ามยืมภาพกัน`);
    } else {
      owners.set(w.art, w);
    }
  }
}

// duplicate Thai gloss within the same category makes some questions
// unanswerable — two options can show the identical Thai text with only one
// marked correct
{
  const byThaiCat = new Map();
  for (const w of vocab) {
    const key = `${w.cat}|${w.thai}`;
    const bucket = byThaiCat.get(key) || [];
    bucket.push(w);
    byThaiCat.set(key, bucket);
  }
  for (const [key, list] of byThaiCat) {
    if (list.length > 1) {
      const [cat] = key.split("|");
      errors.push(
        `คำแปลไทย "${list[0].thai}" ซ้ำกันในหมวด "${cat}": ${list.map((w) => w.hanzi).join(", ")} — ผู้เล่นจะตอบไม่ได้ถ้าทั้งคู่โผล่ในข้อเดียวกัน`,
      );
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
