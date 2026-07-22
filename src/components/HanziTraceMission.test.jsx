import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HanziTraceMission from "./HanziTraceMission";

const context = {
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  scale: vi.fn(),
  stroke: vi.fn(),
};

const missionView = (mode = "practice") => ({
  id: `hanzi-${mode}`,
  type: "hanziTrace",
  characterToTrace: "人",
  thaiMeaning: "คน",
  mechanics: { mode, minStrokePoints: 4 },
});

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0, y: 0, top: 0, left: 0, right: 300, bottom: 300, width: 300, height: 300,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.values(context).filter(vi.isMockFunction).forEach((mock) => mock.mockClear());
});

const drawStroke = (canvas, points, pointerId = 1) => {
  fireEvent.pointerDown(canvas, { clientX: points[0].x, clientY: points[0].y, pointerId });
  points.slice(1).forEach((point) => fireEvent.pointerMove(canvas, { clientX: point.x, clientY: point.y, pointerId }));
  fireEvent.pointerUp(canvas, { clientX: points.at(-1).x, clientY: points.at(-1).y, pointerId });
};

describe("HanziTraceMission", () => {
  it("captures pointers, prevents touch scrolling, stores strokes, and supports Undo/Clear", () => {
    const { container } = render(<HanziTraceMission missionView={missionView()} onSubmit={vi.fn()} disabled={false} feedback={null} />);
    const canvas = container.querySelector("canvas");
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();

    expect(canvas).toHaveStyle({ touchAction: "none" });
    expect(container.querySelector(".trace-guide")).toBeInTheDocument();
    drawStroke(canvas, [{ x: 50, y: 50 }, { x: 90, y: 90 }, { x: 130, y: 130 }]);
    drawStroke(canvas, [{ x: 220, y: 60 }, { x: 180, y: 120 }, { x: 140, y: 210 }], 2);

    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(2);
    expect(screen.getByText(/2 เส้น/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText(/1 เส้น/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ล้าง" }));
    expect(screen.getByText(/0 เส้น/)).toBeInTheDocument();
  });

  it("shows a timed challenge preview and restores the guide on request", () => {
    vi.useFakeTimers();
    const { container } = render(<HanziTraceMission missionView={missionView("challenge")} onSubmit={vi.fn()} disabled={false} feedback={null} />);

    expect(container.querySelector(".trace-guide")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2500));
    expect(container.querySelector(".trace-guide")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "แสดงเส้นนำ" }));
    expect(container.querySelector(".trace-guide")).toBeInTheDocument();
  });

  it("emits broad answer-free stroke metrics without the target character", () => {
    const onSubmit = vi.fn();
    const { container } = render(<HanziTraceMission missionView={missionView("challenge")} onSubmit={onSubmit} disabled={false} feedback={null} />);
    const canvas = container.querySelector("canvas");
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();
    drawStroke(canvas, [{ x: 70, y: 55 }, { x: 95, y: 100 }, { x: 120, y: 150 }, { x: 145, y: 220 }]);
    drawStroke(canvas, [{ x: 230, y: 60 }, { x: 205, y: 105 }, { x: 180, y: 155 }, { x: 155, y: 225 }], 2);
    drawStroke(canvas, [{ x: 65, y: 150 }, { x: 110, y: 150 }, { x: 165, y: 150 }, { x: 225, y: 150 }], 3);

    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: "hanziTrace",
      strokeCount: 3,
      pointCount: 12,
      boundsCoverage: expect.any(Number),
      quadrantCoverage: 1,
      passed: true,
      attempted: true,
    }));
    expect(JSON.stringify(onSubmit.mock.calls)).not.toContain("人");
  });
});
