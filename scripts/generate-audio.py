"""
Generates public/audio/<id>.mp3 and public/audio/<id>_slow.mp3 for every
vocab.json and sentences.json entry using edge-tts (Microsoft Edge's TTS
endpoint, free, no API key). Run once at content-authoring time on a dev
machine - never called at build time or runtime, so nothing in the deployed
app depends on this endpoint being up.

Two files per phrase: a normal-speed one and a "_slow" one generated with
rate="-40%", matching the audio/audioSlow paths already written into
vocab.json and sentences.json.

Everything is written under public/audio/ - never src/assets/, because Vite
hashes filenames under src/ at build time, which would break the literal
"/audio/xxx.mp3" paths stored in the JSON content.

Usage:
    pip install edge-tts
    python scripts/generate-audio.py

Safe to re-run: any file that already exists on disk is skipped, so adding a
handful of new words later only generates the new ones.
"""
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"
SLOW_RATE = "-40%"
ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "src" / "content"
AUDIO_DIR = ROOT / "public" / "audio"


def load_entries():
    vocab = json.loads((CONTENT_DIR / "vocab.json").read_text(encoding="utf-8"))
    sentences = json.loads((CONTENT_DIR / "sentences.json").read_text(encoding="utf-8"))
    entries = []
    for item in vocab:
        entries.append((item["id"], item["hanzi"]))
    for item in sentences:
        entries.append((item["id"], item["hanzi"]))

    # Each entry needs a normal file and a slow file.
    jobs = []
    for entry_id, text in entries:
        jobs.append((entry_id, text, None))
        jobs.append((f"{entry_id}_slow", text, SLOW_RATE))
    return jobs


async def generate_one(filename, text, rate, semaphore):
    target = AUDIO_DIR / f"{filename}.mp3"
    if target.exists():
        return "skipped"

    async with semaphore:
        kwargs = {"rate": rate} if rate else {}
        communicate = edge_tts.Communicate(text, VOICE, **kwargs)
        await communicate.save(str(target))
    return "generated"


async def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    jobs = load_entries()

    # Cap concurrent requests so we don't hammer the endpoint or trip rate limits.
    semaphore = asyncio.Semaphore(4)
    generated = 0
    skipped = 0
    failed = []

    for index, (filename, text, rate) in enumerate(jobs, start=1):
        try:
            result = await generate_one(filename, text, rate, semaphore)
        except Exception as error:  # noqa: BLE001 - report and keep going
            failed.append((filename, str(error)))
            print(f"[{index}/{len(jobs)}] FAILED {filename}: {error}", file=sys.stderr)
            continue

        if result == "generated":
            generated += 1
        else:
            skipped += 1
        print(f"[{index}/{len(jobs)}] {result}: {filename}.mp3")

    total_bytes = sum(f.stat().st_size for f in AUDIO_DIR.glob("*.mp3"))
    print("\nAUDIO GENERATION")
    print(f"- Generated: {generated}, skipped (already existed): {skipped}, failed: {len(failed)}")
    print(f"- public/audio/ now has {len(list(AUDIO_DIR.glob('*.mp3')))} files, {total_bytes / 1024:.0f} KB total")
    if failed:
        print("- Failed entries:")
        for filename, error in failed:
            print(f"    {filename}: {error}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
