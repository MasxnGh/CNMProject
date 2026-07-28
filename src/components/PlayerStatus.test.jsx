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
  it("exposes compact player values as named definitions", () => {
    render(<PlayerStatus progress={progress} compact />);

    expect(screen.getByRole("definition", { name: "ระดับ" })).toHaveTextContent("Lv. 4");
    expect(screen.getByRole("definition", { name: "เหรียญ" })).toHaveTextContent("19");
    expect(screen.getByRole("definition", { name: "ดาวสะสม" })).toHaveTextContent("12");
    expect(screen.getByRole("definition", { name: "ด่านที่ผ่านแล้ว" })).toHaveTextContent("3/15");
  });
});
