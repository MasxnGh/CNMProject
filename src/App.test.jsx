import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GameProvider } from "./state/GameContext.jsx";
import { RunProvider } from "./state/RunContext.jsx";
import { BurstProvider } from "./state/BurstContext.jsx";
import App from "./App.jsx";

afterEach(() => cleanup());

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <GameProvider>
        <RunProvider>
          <BurstProvider>
            <App />
          </BurstProvider>
        </RunProvider>
      </GameProvider>
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("renders the home page with no console errors", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderAt("/");

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
