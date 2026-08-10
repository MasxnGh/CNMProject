/**
 * Imports real photography into public/img/vocab/, replacing the SVG-
 * rasterized placeholders one key at a time. Only touches files whose name
 * (minus extension) matches a real vocab art key — anything else in the
 * source folder is reported and skipped.
 *
 * Source photos vary wildly in aspect ratio and are centered on either a
 * flat white background or a photographed sticker-on-paper background, so
 * naive cropping/padding doesn't work uniformly:
 *   1. detect each photo's own background colour (median of the 4 corners)
 *   2. find the subject's bounding box by ink-mass percentile — the smallest
 *      window containing 99% of non-background pixel energy. Plain trim()
 *      fails here: stray sparkles/vignettes near the frame edge blow the
 *      box out to full-frame on ~1 in 6 of these photos.
 *   3. scale so the subject's longest side fills 80% of a square frame
 *      (0.88 was tested and clips several subjects against the app's
 *      circular mask — 0.80 is the largest fill that never clips)
 *   4. pad to 400×400 with the photo's own detected background colour,
 *      then normalise that colour to pure white so all sources match
 *   5. encode to webp, stepping quality down until under the 60KB budget
 *
 * Safe to re-run whenever more photos are dropped into the source folder —
 * only keys present there are touched.
 * Run via `npm run import:photos [sourceDir]` (defaults to the folder the
 * photos were originally supplied in).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { VOCAB_ICON_KEYS } from "../src/lib/art.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/img/vocab");
const sourceDir = process.argv[2] || "C:/Users/ASUS/Downloads/picture";

const CANVAS = 400;
const FILL = 0.8; // subject's longest side, as a fraction of the frame — 0.88 clips against the circular mask
const MAX_BYTES = 60 * 1024;
const PROBE = 400; // analysis resolution, independent of source resolution
const INK_THRESHOLD = 26; // per-channel distance from background to count as "subject"
const TAIL = 0.006; // ignore this fraction of ink mass at each edge (sparkles, vignette noise)

if (!existsSync(sourceDir)) {
  console.log(`ไม่พบโฟลเดอร์ต้นทาง: ${sourceDir}`);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

/** Background colour + subject bounding box (as 0..1 fractions), via ink-mass percentile. */
async function analyse(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .resize(PROBE, PROBE, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const at = (x, y) => {
    const i = (y * w + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const corners = [at(1, 1), at(w - 2, 1), at(1, h - 2), at(w - 2, h - 2)];
  const med = (k) => corners.map((c) => c[k]).sort((a, b) => a - b)[1];
  const bg = { r: med(0), g: med(1), b: med(2) };

  const col = new Float64Array(w);
  const row = new Float64Array(h);
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = at(x, y);
      const d = Math.max(Math.abs(r - bg.r), Math.abs(g - bg.g), Math.abs(b - bg.b));
      if (d > INK_THRESHOLD) {
        col[x] += d;
        row[y] += d;
        total += d;
      }
    }
  }
  if (total === 0) return { bg, box: null };

  const edge = (arr, forward) => {
    const n = arr.length;
    let acc = 0;
    const limit = total * TAIL;
    for (let i = 0; i < n; i++) {
      const idx = forward ? i : n - 1 - i;
      acc += arr[idx];
      if (acc >= limit) return idx;
    }
    return forward ? 0 : n - 1;
  };

  return {
    bg,
    box: { x0: edge(col, true) / w, x1: (edge(col, false) + 1) / w, y0: edge(row, true) / h, y1: (edge(row, false) + 1) / h },
  };
}

async function encodeUnderBudget(buffer) {
  let quality = 82;
  let out = await sharp(buffer).webp({ quality }).toBuffer();
  while (out.length > MAX_BYTES && quality > 35) {
    quality -= 10;
    out = await sharp(buffer).webp({ quality }).toBuffer();
  }
  return out;
}

async function importOne(key, filePath) {
  const raw = await sharp(filePath).toBuffer();
  const meta = await sharp(raw).metadata();
  const { bg, box } = await analyse(raw);

  let region = { left: 0, top: 0, width: meta.width, height: meta.height };
  if (box) {
    const left = Math.max(0, Math.floor(box.x0 * meta.width));
    const top = Math.max(0, Math.floor(box.y0 * meta.height));
    const right = Math.min(meta.width, Math.ceil(box.x1 * meta.width));
    const bottom = Math.min(meta.height, Math.ceil(box.y1 * meta.height));
    region = { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
  }

  const cropped = await sharp(raw).flatten({ background: bg }).extract(region).toBuffer({ resolveWithObject: true });
  const frame = Math.round(FILL * CANVAS);
  const scale = Math.min(frame / cropped.info.width, frame / cropped.info.height);
  const w = Math.max(1, Math.round(cropped.info.width * scale));
  const h = Math.max(1, Math.round(cropped.info.height * scale));

  // normalise the detected background to pure white, whatever shade it started as
  const lum = (bg.r + bg.g + bg.b) / 3;
  const gain = 255 / Math.max(1, lum - 3);

  const squared = await sharp(cropped.data)
    .resize(w, h, { fit: "fill" })
    .extend({
      top: Math.floor((CANVAS - h) / 2),
      bottom: Math.ceil((CANVAS - h) / 2),
      left: Math.floor((CANVAS - w) / 2),
      right: Math.ceil((CANVAS - w) / 2),
      background: bg,
    })
    .linear(gain, 0)
    .toBuffer();

  const out = await encodeUnderBudget(squared);
  writeFileSync(path.join(outDir, `${key}.webp`), out);
  return out.length;
}

const keySet = new Set(VOCAB_ICON_KEYS);
const sourceFiles = readdirSync(sourceDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

const matched = [];
const unmatched = [];
for (const file of sourceFiles) {
  const key = file.replace(/\.(png|jpe?g|webp)$/i, "");
  if (keySet.has(key)) matched.push({ key, file });
  else unmatched.push(file);
}

let total = 0;
for (const { key, file } of matched) {
  total += await importOne(key, path.join(sourceDir, file));
}

const stillOnSvg = VOCAB_ICON_KEYS.filter((k) => !matched.some((m) => m.key === k));

console.log(`นำเข้า ${matched.length} ไฟล์จาก ${sourceDir}`);
console.log(`ขนาดรวม ${(total / 1024).toFixed(1)} KB (เฉลี่ย ${(total / matched.length / 1024).toFixed(1)} KB/ไฟล์)`);

if (unmatched.length) {
  console.log(`\nไฟล์ที่ไม่ตรงกับ key ใดเลย (ข้ามไป, ${unmatched.length}):`);
  unmatched.forEach((f) => console.log(`  ⚠ ${f}`));
}

console.log(`\nยังใช้ภาพวาด SVG อยู่ (ไม่มีรูปถ่าย, ${stillOnSvg.length}): ${stillOnSvg.join(", ")}`);
