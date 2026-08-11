/**
 * Fills in missing pronunciation audio in public/audio/ using Microsoft
 * Edge's free neural TTS (zh-CN-XiaoxiaoNeural) — no API key needed.
 *
 * Only synthesizes files that don't already exist, so it's safe to re-run
 * after adding new vocab/clock entries; it never touches or re-generates
 * files already on disk.
 *
 * Covers:
 *   - every vocab word, as public/audio/<id>.mp3 (word.hanzi spoken)
 *   - every clock phrase in config.json, as public/audio/clock_<slug>.mp3
 * These are the two places the game shows a full Chinese phrase as the
 * *prompt* (not the thing being tested), so speaking it is safe and doesn't
 * leak an answer.
 *
 * Run via `npm run generate:audio`.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import VOCAB from "../src/content/vocab.json" with { type: "json" };
import CONFIG from "../src/content/config.json" with { type: "json" };
import { clockAudioSrc } from "../src/lib/audioKey.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/audio");
mkdirSync(outDir, { recursive: true });

const VOICE = "zh-CN-XiaoxiaoNeural";

const tts = new MsEdgeTTS();
await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

async function synthesize(text, destPath) {
  const { audioStream } = await tts.toStream(text);
  const chunks = [];
  for await (const chunk of audioStream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  writeFileSync(destPath, buffer);
  return buffer.length;
}

let made = 0;
let skipped = 0;
let totalBytes = 0;

for (const word of VOCAB) {
  const dest = path.join(root, "public/audio", `${word.id}.mp3`);
  if (existsSync(dest)) {
    skipped += 1;
    continue;
  }
  totalBytes += await synthesize(word.hanzi, dest);
  made += 1;
}

for (const clock of CONFIG.clocks) {
  const dest = path.join(root, "public", clockAudioSrc(clock).replace(/^\//, ""));
  if (existsSync(dest)) {
    skipped += 1;
    continue;
  }
  totalBytes += await synthesize(clock.hanzi, dest);
  made += 1;
}

console.log(`สร้างไฟล์เสียงใหม่ ${made} ไฟล์ (รวม ${(totalBytes / 1024).toFixed(1)} KB), ข้ามของเดิม ${skipped} ไฟล์`);
