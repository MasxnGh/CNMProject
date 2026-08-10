/**
 * Converts every image in public/img/vocab to webp, capped at 600px wide
 * and ~60KB per file. Re-encodes existing .webp too, so re-running after
 * swapping in real photography keeps everyone under budget.
 * Run via `npm run optimize-images`.
 */
import { readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const imgDir = path.join(root, "public/img/vocab");

const MAX_WIDTH = 600;
const MAX_BYTES = 60 * 1024;
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

async function encodeUnderBudget(inputBuffer, width) {
  let quality = 82;
  let out = await sharp(inputBuffer).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  while (out.length > MAX_BYTES && quality > 35) {
    quality -= 10;
    out = await sharp(inputBuffer).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  }
  return out;
}

async function optimizeFile(file) {
  const srcPath = path.join(imgDir, file);
  const before = statSync(srcPath).size;
  const buffer = readFileSync(srcPath);
  const meta = await sharp(buffer).metadata();
  const targetWidth = Math.min(meta.width || MAX_WIDTH, MAX_WIDTH);

  const out = await encodeUnderBudget(buffer, targetWidth);
  const key = file.replace(IMAGE_EXT, "");
  const destPath = path.join(imgDir, `${key}.webp`);

  writeFileSync(destPath, out);
  if (destPath !== srcPath) unlinkSync(srcPath);

  return { file: `${key}.webp`, before, after: out.length };
}

const files = readdirSync(imgDir).filter((f) => IMAGE_EXT.test(f));
if (files.length === 0) {
  console.log("ไม่พบไฟล์ภาพใน public/img/vocab/");
  process.exit(0);
}

const results = [];
for (const file of files) {
  results.push(await optimizeFile(file));
}

const totalBefore = results.reduce((sum, r) => sum + r.before, 0);
const totalAfter = results.reduce((sum, r) => sum + r.after, 0);
const overBudget = results.filter((r) => r.after > MAX_BYTES);

console.log(`\nประมวลผล ${results.length} ไฟล์`);
console.log(`ขนาดก่อน  ${(totalBefore / 1024).toFixed(1)} KB`);
console.log(`ขนาดหลัง  ${(totalAfter / 1024).toFixed(1)} KB`);
const savedPct = totalBefore ? (100 * (1 - totalAfter / totalBefore)).toFixed(1) : "0.0";
console.log(`ลดลง      ${((totalBefore - totalAfter) / 1024).toFixed(1)} KB (${savedPct}%)`);

if (overBudget.length) {
  console.log(`\nไฟล์ที่ยังเกิน 60KB แม้ลดคุณภาพแล้ว (${overBudget.length}):`);
  overBudget.forEach((r) => console.log(`  ⚠ ${r.file} — ${(r.after / 1024).toFixed(1)} KB`));
}
