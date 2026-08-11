import { describe, it, expect } from "vitest";
import { gridSize, buildWalls, isSolvable, buildRoute, commandFor, initMaze } from "./maze.js";
import CONFIG from "../content/config.json";

const MAX_LEVEL = CONFIG.maze.levels;
const stepBudget = (n) => 2 * (n - 1) + 6;

const stepOf = (a, b) => `${b[0] - a[0]},${b[1] - a[1]}`;

describe("maze generation", () => {
  it("never produces a level whose flag is walled off (all levels × 200 layouts)", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 200; i++) {
        const { walls, n } = initMaze(level);
        expect(isSolvable(walls, n), `level ${level} generated an unreachable flag`).toBe(true);
      }
    }
  });

  it("never walls off the start or the goal cell itself", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const { n, walls } = initMaze(level);
      expect(walls.has("0,0")).toBe(false);
      expect(walls.has(`${n - 1},${n - 1}`)).toBe(false);
    }
  });
});

describe("route — a planned walk, not a random wander", () => {
  it("always starts at the corner and ends on the flag", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 100; i++) {
        const { n, route } = initMaze(level);
        expect(route[0]).toEqual([0, 0]);
        expect(route[route.length - 1]).toEqual([n - 1, n - 1]);
      }
    }
  });

  it("only ever steps to an adjacent cell, and never onto a wall", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 100; i++) {
        const { n, walls, route } = initMaze(level);
        for (let s = 0; s < route.length; s++) {
          const [r, c] = route[s];
          expect(r >= 0 && r < n && c >= 0 && c < n, "route left the grid").toBe(true);
          expect(walls.has(`${r},${c}`), "route walked through a wall").toBe(false);
          if (s === 0) continue;
          const dr = Math.abs(route[s][0] - route[s - 1][0]);
          const dc = Math.abs(route[s][1] - route[s - 1][1]);
          expect(dr + dc, "route teleported").toBe(1);
        }
      }
    }
  });

  it("stays inside the step budget so a level can't drag on", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 200; i++) {
        const { n, route } = initMaze(level);
        expect(route.length - 1).toBeLessThanOrEqual(stepBudget(n));
      }
    }
  });

  it("uses at least 3 of the 4 directions, so the walk isn't just down-and-right", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 100; i++) {
        const { route } = initMaze(level);
        const dirs = new Set();
        for (let s = 0; s < route.length - 1; s++) dirs.add(stepOf(route[s], route[s + 1]));
        expect(dirs.size, `level ${level} route only used ${dirs.size} direction(s)`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("covers all 4 directions across a full 5-level run", () => {
    const dirs = new Set();
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const { route } = initMaze(level);
      for (let s = 0; s < route.length - 1; s++) dirs.add(stepOf(route[s], route[s + 1]));
    }
    expect(dirs.size).toBe(4);
  });
});

describe("commandFor", () => {
  it("always issues a command matching the route's actual next step", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let i = 0; i < 100; i++) {
        const { route } = initMaze(level);
        for (let s = 0; s < route.length - 1; s++) {
          const cmd = commandFor(route, s);
          expect(cmd, `no command exists for step ${s}`).toBeTruthy();
          expect([route[s][0] + cmd.dy, route[s][1] + cmd.dx]).toEqual(route[s + 1]);
        }
      }
    }
  });

  it("varies the wording between the two synonyms for a direction", () => {
    const walls = new Set();
    const route = buildRoute(walls, 4);
    const seen = new Set();
    for (let i = 0; i < 400; i++) seen.add(commandFor(route, 0).hanzi);
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("buildRoute", () => {
  it("returns null only when the flag is genuinely unreachable", () => {
    const sealed = new Set(["0,1", "1,0", "1,1"]);
    expect(buildRoute(sealed, 4)).toBeNull();
    expect(buildRoute(new Set(), 4)).not.toBeNull();
  });

  it("gridSize caps at 6 so later levels differ by layout, not size", () => {
    expect([1, 2, 3, 4, 5, 9].map(gridSize)).toEqual([4, 5, 5, 6, 6, 6]);
    expect(buildWalls(6).size).toBe(Math.floor(36 * 0.16));
  });
});
