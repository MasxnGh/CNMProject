/**
 * dujeen-quest-gameplay-prompts.md Prompt B - the "3-tier visual system"
 * for exercise option cards: a real image if the vocab entry has one, else
 * an emoji, else the hanzi itself rendered big on a dark gradient card.
 * vocab.json's `visual: {type, value}` field already existed but nothing
 * read it yet (every entry is currently {type: null, value: null}, so every
 * card falls through to the hanzi tier today) - this is what makes it real.
 */
export const resolveVisual = (vocabEntry) => {
  const visual = vocabEntry?.visual;
  if (visual?.type === "image" && visual.value) {
    return { kind: "image", value: visual.value };
  }
  if (visual?.type === "emoji" && visual.value) {
    return { kind: "emoji", value: visual.value };
  }
  return { kind: "hanzi", value: vocabEntry?.hanzi ?? "" };
};
