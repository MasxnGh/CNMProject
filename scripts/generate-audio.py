"""
Generates public/audio/<id>.mp3 for every vocab.json and sentences.json entry
using edge-tts (Microsoft Edge's TTS endpoint, free, no API key). Run once at
content-authoring time on a dev machine - never called at build time or
runtime, so nothing in the deployed app depends on this endpoint being up.

Only one file per phrase: the "slow" variant is not a separate generation -
src/lib/audio.js plays the same file at a lower HTMLAudioElement.playbackRate
instead, which halves how much needs generating here without losing the
feature (see the plan's audio section for the reasoning).

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
    return entries


async def generate_one(entry_id, text, semaphore):
    target = AUDIO_DIR / f"{entry_id}.mp3"
    if target.exists():
        return "skipped"

    async with semaphore:
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(target))
    return "generated"


async def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    entries = load_entries()

    # Cap concurrent requests so we don't hammer the endpoint or trip rate limits.
    semaphore = asyncio.Semaphore(4)
    generated = 0
    skipped = 0
    failed = []

    for index, (entry_id, text) in enumerate(entries, start=1):
        try:
            result = await generate_one(entry_id, text, semaphore)
        except Exception as error:  # noqa: BLE001 - report and keep going
            failed.append((entry_id, str(error)))
            print(f"[{index}/{len(entries)}] FAILED {entry_id}: {error}", file=sys.stderr)
            continue

        if result == "generated":
            generated += 1
        else:
            skipped += 1
        print(f"[{index}/{len(entries)}] {result}: {entry_id}.mp3")

    total_bytes = sum(f.stat().st_size for f in AUDIO_DIR.glob("*.mp3"))
    print("\nAUDIO GENERATION")
    print(f"- Generated: {generated}, skipped (already existed): {skipped}, failed: {len(failed)}")
    print(f"- public/audio/ now has {len(list(AUDIO_DIR.glob('*.mp3')))} files, {total_bytes / 1024:.0f} KB total")
    if failed:
        print("- Failed entries:")
        for entry_id, error in failed:
            print(f"    {entry_id}: {error}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
