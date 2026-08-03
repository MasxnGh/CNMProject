/**
 * Copies stroke-order data for exactly the characters vocab.json's writable
 * words need, from the installed hanzi-writer-data package into
 * src/content/hanzi-data/. Keeping this a small, explicit local subset
 * (rather than dynamic-importing straight against node_modules/hanzi-writer-data,
 * which has ~9500 files) keeps the production build from pre-chunking every
 * character in the whole package. Run via `node scripts/copy-hanzi-data.mjs`
 * whenever vocab.json's writable set changes.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vocabPath = path.join(rootDir, "src/content/vocab.json");
const sourceDir = path.join(rootDir, "node_modules/hanzi-writer-data");
const targetDir = path.join(rootDir, "src/content/hanzi-data");

const vocab = JSON.parse(readFileSync(vocabPath, "utf8"));
const needed = new Set(
  vocab
    .filter((word) => word.writable)
    .flatMap((word) => [...word.hanzi]),
);

mkdirSync(targetDir, { recursive: true });

// Remove stale files (characters no longer needed) so this stays a clean mirror.
readdirSync(targetDir).forEach((file) => {
  const char = file.replace(/\.json$/, "");
  if (!needed.has(char)) unlinkSync(path.join(targetDir, file));
});

let copied = 0;
needed.forEach((char) => {
  const src = path.join(sourceDir, `${char}.json`);
  if (!existsSync(src)) return;
  copyFileSync(src, path.join(targetDir, `${char}.json`));
  copied += 1;
});

console.log(`copied stroke data for ${copied}/${needed.size} characters into src/content/hanzi-data/`);
