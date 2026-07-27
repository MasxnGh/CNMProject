import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PlayerStatus from "./PlayerStatus";

const progress = {
  level: 4,
  xp: 265,
  coins: 19,
  totalStars: 12,
  completedLevels: [1, 2, 3],
};

afterEach(cleanup);

beforeEach(() => {
  globalThis.React = React;
});

describe("PlayerStatus", () => {
  it("provides accessible labels for compact icon statistics", () => {
    render(<PlayerStatus progress={progress} compact />);

    expect(screen.getByLabelText("Coins: 19")).toBeInTheDocument();
    expect(screen.getByLabelText("Stars: 12")).toBeInTheDocument();
    expect(screen.getByLabelText("Completed levels: 3 of 15")).toBeInTheDocument();
  });
});
