import exercisesData from "../content/exercises.json";

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Reorders greedily so no type repeats more than twice in a row. Falls back
// to allowing a repeat only when every remaining item is the blocked type.
function enforceTypeSpread(items) {
  const remaining = [...items];
  const result = [];

  while (remaining.length > 0) {
    const lastTwo = result.slice(-2);
    const blockedType = lastTwo.length === 2 && lastTwo[0].type === lastTwo[1].type ? lastTwo[0].type : null;

    let pickIndex = remaining.findIndex((item) => item.type !== blockedType);
    if (pickIndex === -1) pickIndex = 0;

    result.push(remaining.splice(pickIndex, 1)[0]);
  }

  return result;
}

// write_character is the slowest exercise to answer (drawing takes real
// time), so it gets a stricter rule than enforceTypeSpread's generic
// "no more than 2 in a row": never even 2 in a row. Swaps the second of any
// adjacent pair forward to the next slot that isn't already that type.
function enforceNoAdjacentType(items, type) {
  const result = [...items];
  for (let i = 1; i < result.length; i += 1) {
    if (result[i].type !== type || result[i - 1].type !== type) continue;
    const swapIndex = result.findIndex((item, j) => j > i && item.type !== type);
    if (swapIndex !== -1) {
      [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
    }
  }
  return result;
}

// Keeps at most `max` items of `type` (already-shuffled order, so this is
// effectively a random pick of which ones survive), dropping the rest.
function capType(items, type, max) {
  let count = 0;
  return items.filter((item) => {
    if (item.type !== type) return true;
    count += 1;
    return count <= max;
  });
}

/**
 * Builds an exercise queue drawn evenly across `lessonIds` (round-robin, so
 * no single lesson clusters at the front) with no exercise type repeating
 * more than twice consecutively. A normal single-lesson quiz is just the
 * lessonIds=[oneId] case of the same algorithm - `count` can be omitted to
 * use everything available.
 *
 * @param {string[]} lessonIds
 * @param {number|null} [count]
 * @param {{allowedTypes?: Set<string>}} [options]
 */
export function buildPool(lessonIds, count, { allowedTypes } = {}) {
  const candidates = exercisesData.filter(
    (exercise) => lessonIds.includes(exercise.lessonId) && (!allowedTypes || allowedTypes.has(exercise.type)),
  );

  const byLesson = new Map(lessonIds.map((id) => [id, []]));
  candidates.forEach((exercise) => {
    byLesson.get(exercise.lessonId)?.push(exercise);
  });
  byLesson.forEach((list, id) => byLesson.set(id, capType(shuffle(list), "write_character", 2)));

  const roundRobin = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const id of lessonIds) {
      const list = byLesson.get(id);
      if (list && list.length > 0) {
        roundRobin.push(list.shift());
        hasMore = true;
      }
    }
  }

  const balanced = enforceNoAdjacentType(enforceTypeSpread(roundRobin), "write_character");
  const total = count == null ? balanced.length : Math.min(count, balanced.length);
  return balanced.slice(0, total);
}
