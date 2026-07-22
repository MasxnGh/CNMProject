import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FinalBossMission from "./FinalBossMission";

describe("FinalBossMission", () => {
  afterEach(cleanup);
  const missionView = {
    id: "15-1",
    type: "finalBoss",
    title: "Final Boss Mixed Mission",
    instruction: "ตอบให้ถูกเพื่อทำให้พลังมังกรผู้พิทักษ์ลดลง",
    chineseText: "คำอวยพร",
    options: ["新年快乐", "再见"],
    mechanics: { bossHp: 100 },
  };

  it("derives boss HP from completed missions and correct feedback", () => {
    const { container, rerender } = render(
      <FinalBossMission
        missionView={missionView}
        bossProgress={{ currentMission: 2, totalMissions: 5 }}
        onSubmit={vi.fn()}
        disabled={false}
        feedback={null}
      />,
    );
    expect(container.querySelector(".boss-bar span")).toHaveStyle({ width: "60%" });

    rerender(
      <FinalBossMission
        missionView={missionView}
        bossProgress={{ currentMission: 2, totalMissions: 5 }}
        onSubmit={vi.fn()}
        disabled
        feedback={{ correct: true, selectedValue: "新年快乐", correctOption: "新年快乐" }}
      />,
    );
    expect(container.querySelector(".boss-bar span")).toHaveStyle({ width: "40%" });
    expect(screen.getByText("พลังมังกรผู้พิทักษ์")).toBeInTheDocument();
  });

  it("keeps answer controls disabled during feedback", () => {
    render(
      <FinalBossMission
        missionView={missionView}
        bossProgress={{ currentMission: 4, totalMissions: 5 }}
        onSubmit={vi.fn()}
        disabled
        feedback={{ correct: false, selectedValue: "再见", correctOption: "新年快乐" }}
      />,
    );
    expect(screen.getAllByRole("button", { name: "新年快乐" })[0]).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "再见" }));
  });
});
