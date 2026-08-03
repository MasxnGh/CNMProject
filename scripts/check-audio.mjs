/**
 * Checks every "audio" and "audioSlow" path in vocab.json + sentences.json
 * actually exists under public/audio/. Run via `npm run check:audio`.
 * If anything's missing, fill it in with `python scripts/generate-audio.py`.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(rootDir, "src/content");
const publicDir = path.join(rootDir, "public");

const vocab = JSON.parse(readFileSync(path.join(contentDir, "vocab.json"), "utf8"));
const sentences = JSON.parse(readFileSync(path.join(contentDir, "sentences.json"), "utf8"));

const missing = [];
let checked = 0;

function checkEntries(entries, kind) {
  entries.forEach((entry) => {
    ["audio", "audioSlow"].forEach((field) => {
      const webPath = entry[field];
      if (!webPath) return; // field itself is null - nothing to check, not a "missing file"
      checked += 1;
      const fsPath = path.join(publicDir, webPath.replace(/^\//, ""));
      if (!existsSync(fsPath)) {
        missing.push({ kind, id: entry.id, field, path: webPath });
      }
    });
  });
}

checkEntries(vocab, "vocab");
checkEntries(sentences, "sentence");

console.log("AUDIO FILE CHECK");
console.log(`- Entries: ${vocab.length} vocab, ${sentences.length} sentences`);
console.log(`- Audio references checked: ${checked}`);
console.log(`- Missing: ${missing.length}`);
missing.forEach((m) => console.log(`  [MISSING] ${m.kind} ${m.id} (${m.field}): ${m.path}`));

if (missing.length > 0) {
  console.log("\nRun `python scripts/generate-audio.py` to fill these in.");
  process.exitCode = 1;
}
