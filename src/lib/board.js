/**
 * Local leaderboard: 16 categories × 3 difficulties = 48 separate boards,
 * persisted to localStorage. Every entry is a real result from this player —
 * there is no seed/placeholder data anywhere in this module.
 */

const STORAGE_KEY = "zhiyuan.board.v1";
const SCHEMA_VERSION = 1;
const MAX_STORED = 20;
export const MAX_DISPLAYED = 10;

function emptyBoard() {
  return { version: SCHEMA_VERSION, entries: {} };
}

function isValidBoard(data) {
  return Boolean(data && typeof data === "object" && data.entries && typeof data.entries === "object");
}

/** Only ever called from useEffect by callers — never during render, to avoid hydration mismatches. */
export function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw);
    if (!isValidBoard(parsed)) return emptyBoard();
    if (parsed.version !== SCHEMA_VERSION) return migrateBoard(parsed);
    return parsed;
  } catch {
    // corrupt data — never crash the app over a leaderboard
    return emptyBoard();
  }
}

function migrateBoard(old) {
  // no earlier schema exists yet; an unrecognized version is safest treated as fresh
  return emptyBoard();
}

export function saveBoard(board) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    // storage full/unavailable — the run itself still succeeded, don't crash over this
  }
}

const boardKey = (catId, diffId) => `${catId}|${diffId}`;

export function getEntries(board, catId, diffId) {
  return board.entries[boardKey(catId, diffId)] || [];
}

/** Returns a new board with `entry` inserted into the catId/diffId list, capped at MAX_STORED. */
export function recordScore(board, catId, diffId, entry) {
  const key = boardKey(catId, diffId);
  const list = [...(board.entries[key] || []), entry];
  list.sort((a, b) => b.score - a.score);
  return { ...board, entries: { ...board.entries, [key]: list.slice(0, MAX_STORED) } };
}
