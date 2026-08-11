import { supabase, hasSupabase } from "./supabase.js";

/**
 * The shared, cross-device leaderboard backed by Supabase.
 *
 * Every function here is written to fail soft: if the backend is missing,
 * offline, or erroring, the caller gets an empty list or a `false` rather
 * than an exception. Losing the leaderboard must never cost a player the run
 * they just finished.
 */

export const MAX_ROWS = 20;
const TABLE = "scores";
const NAME_LIMIT = 24; // matches the name_len check constraint on the table

/** Trims/clamps to what the table's CHECK constraints will actually accept. */
function sanitize(entry) {
  const name = String(entry.name ?? "").trim().slice(0, NAME_LIMIT) || "ผู้เล่น";
  return {
    name,
    avatar: entry.avatar || "fox",
    score: Math.max(0, Math.min(2000000, Math.round(entry.score) || 0)),
    mode_id: entry.modeId,
    diff_id: entry.diffId,
    cat_ids: entry.catIds.slice(0, 16),
    accuracy: Math.max(0, Math.min(100, Math.round(entry.accuracy) || 0)),
    best_combo: Math.max(0, Math.min(9999, Math.round(entry.bestCombo) || 0)),
  };
}

/** Posts one finished run. Returns true only if the row actually landed. */
export async function submitScore(entry) {
  if (!hasSupabase) return false;
  try {
    const { error } = await supabase.from(TABLE).insert(sanitize(entry));
    if (error) {
      console.warn("[board] ส่งคะแนนไม่สำเร็จ:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[board] ส่งคะแนนไม่สำเร็จ:", err.message);
    return false;
  }
}

/**
 * Top scores for one category+difficulty, highest first. `cat_ids` is an
 * array column because a run can cover several categories at once, so a run
 * shows up on every board it was played across.
 */
export async function fetchTopScores(catId, diffId, limit = MAX_ROWS) {
  if (!hasSupabase) return { rows: [], error: "ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์" };
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id,name,avatar,score,mode_id,accuracy,best_combo,created_at")
      .contains("cat_ids", [catId])
      .eq("diff_id", diffId)
      .order("score", { ascending: false })
      .limit(limit);
    if (error) return { rows: [], error: error.message };
    return { rows: data || [], error: null };
  } catch (err) {
    return { rows: [], error: err.message };
  }
}

/**
 * Calls `onInsert` whenever anyone, anywhere, records a new score. The filter
 * is deliberately server-side on difficulty only — category lives in an array
 * column that postgres_changes filters can't match on, so the caller re-checks
 * `cat_ids` itself.
 *
 * Returns an unsubscribe function; always call it on unmount or the socket
 * leaks across page navigations.
 */
export function subscribeToScores(diffId, onInsert) {
  if (!hasSupabase) return () => {};
  const channel = supabase
    .channel(`scores-${diffId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: TABLE, filter: `diff_id=eq.${diffId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
