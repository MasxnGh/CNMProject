/**
 * Maze generation and command selection for the direction-word mode.
 *
 * The player's job here is reading the Chinese instruction, not pathfinding —
 * so the route is planned up front and every command walks one step along it.
 *
 * The route deliberately is NOT the shortest path. Start and goal sit on
 * opposite corners, so any shortest path is monotone and only ever says "down"
 * and "right" — half the direction vocabulary (上 前 左 西) would never appear.
 * Instead the route detours through two random waypoints, which forces some
 * upward/leftward legs, and is then rejected unless it stays under a step
 * budget and actually uses at least 3 of the 4 directions. That gives a route
 * that wanders on purpose rather than wandering at random.
 */
import CONFIG from "../content/config.json";

const STEPS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** Grid grows 4x4 -> 5x5 -> 6x6 and then holds; later levels differ by wall layout. */
export const gridSize = (level) => 4 + Math.min(2, Math.floor(level / 2));

/** Detour allowance on top of the corner-to-corner minimum of 2*(n-1). */
const stepBudget = (n) => 2 * (n - 1) + 6;
const MIN_DIRECTIONS = 3;

export function buildWalls(n) {
  const walls = new Set();
  const count = Math.floor(n * n * 0.16);
  while (walls.size < count) {
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    if ((r === 0 && c === 0) || (r === n - 1 && c === n - 1)) continue;
    walls.add(`${r},${c}`);
  }
  return walls;
}

/** BFS from one cell; returns the parent of every reachable cell (-1 if unreachable). */
function bfsParents(startCell, walls, n) {
  const parent = new Array(n * n).fill(-1);
  parent[startCell] = startCell;

  const queue = [startCell];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    const r = Math.floor(cell / n);
    const c = cell % n;
    for (const [dr, dc] of STEPS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (walls.has(`${nr},${nc}`)) continue;
      const next = nr * n + nc;
      if (parent[next] !== -1) continue;
      parent[next] = cell;
      queue.push(next);
    }
  }
  return parent;
}

/** Shortest path between two cells as an inclusive list of [r,c], or null if walled off. */
function shortestPath(from, to, walls, n) {
  const start = from[0] * n + from[1];
  const end = to[0] * n + to[1];
  const parent = bfsParents(start, walls, n);
  if (parent[end] === -1) return null;

  const cells = [];
  for (let cell = end; cell !== start; cell = parent[cell]) cells.push(cell);
  cells.push(start);
  cells.reverse();
  return cells.map((cell) => [Math.floor(cell / n), cell % n]);
}

export function isSolvable(walls, n) {
  return shortestPath([0, 0], [n - 1, n - 1], walls, n) !== null;
}

const randomCell = (n) => [Math.floor(Math.random() * n), Math.floor(Math.random() * n)];

/** Stitches legs together, dropping the duplicated cell at each junction. */
function joinLegs(legs) {
  const route = legs[0];
  for (let i = 1; i < legs.length; i++) route.push(...legs[i].slice(1));
  return route;
}

const stepKey = (a, b) => `${b[0] - a[0]},${b[1] - a[1]}`;

function distinctDirections(route) {
  const seen = new Set();
  for (let i = 0; i < route.length - 1; i++) seen.add(stepKey(route[i], route[i + 1]));
  return seen.size;
}

/**
 * A route from the start corner to the flag that detours through two random
 * waypoints. Rejected and retried unless it fits the step budget and uses
 * enough different directions; falls back to the plain shortest path so a
 * level always has some valid route.
 */
export function buildRoute(walls, n) {
  const start = [0, 0];
  const goal = [n - 1, n - 1];
  const direct = shortestPath(start, goal, walls, n);
  if (!direct) return null;

  for (let attempt = 0; attempt < 200; attempt++) {
    const a = randomCell(n);
    const b = randomCell(n);
    if (walls.has(`${a[0]},${a[1]}`) || walls.has(`${b[0]},${b[1]}`)) continue;

    const legs = [shortestPath(start, a, walls, n), shortestPath(a, b, walls, n), shortestPath(b, goal, walls, n)];
    if (legs.some((leg) => leg === null)) continue;

    const route = joinLegs(legs);
    if (route.length - 1 > stepBudget(n)) continue;
    if (distinctDirections(route) < MIN_DIRECTIONS) continue;
    return route;
  }
  return direct;
}

/**
 * The instruction for the current step. Each direction has two synonymous
 * commands (向右走 / 往东走) — picking between them at random keeps the
 * wording varied without changing where the player is being sent.
 */
export function commandFor(route, idx) {
  const from = route[idx];
  const to = route[idx + 1];
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  const matching = CONFIG.mazeCommands.filter((cmd) => cmd.dy === dr && cmd.dx === dc);
  return matching[Math.floor(Math.random() * matching.length)];
}

/**
 * Walls are placed at random, so a layout can seal the flag off completely.
 * Regenerate until the start can actually reach it — shipping an unwinnable
 * level would strand the player with no way to finish.
 */
export function initMaze(level) {
  const n = gridSize(level);

  for (let attempt = 0; attempt < 60; attempt++) {
    const walls = buildWalls(n);
    const route = buildRoute(walls, n);
    if (route) return { n, walls, route, idx: 0, pos: route[0], command: commandFor(route, 0) };
  }

  // an empty grid is always solvable — a guaranteed exit beats looping forever
  const walls = new Set();
  const route = buildRoute(walls, n);
  return { n, walls, route, idx: 0, pos: route[0], command: commandFor(route, 0) };
}
