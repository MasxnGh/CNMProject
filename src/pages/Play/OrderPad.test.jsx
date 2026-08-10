import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import OrderPad from "./OrderPad.jsx";

afterEach(() => cleanup());

const sequence = {
  cat: "time",
  title: "เรียงตามลำดับเวลา",
  items: [
    { hanzi: "昨天", thai: "เมื่อวาน" },
    { hanzi: "今天", thai: "วันนี้" },
    { hanzi: "明天", thai: "พรุ่งนี้" },
  ],
};

describe("OrderPad", () => {
  it("place two chips, remove one, chip becomes reusable — check stays disabled until full", () => {
    const onResolve = vi.fn();
    const { container } = render(<OrderPad sequence={sequence} locked={false} onResolve={onResolve} />);

    const checkBtn = screen.getByRole("button", { name: "ตรวจคำตอบ" });
    expect(checkBtn).toBeDisabled();

    const chips = container.querySelectorAll(".seqChip");
    const slots = container.querySelectorAll(".seqSlot");
    expect(chips).toHaveLength(3);
    expect(slots).toHaveLength(3);

    // place 2 of 3 words
    fireEvent.click(chips[0]);
    fireEvent.click(chips[1]);
    expect(chips[0]).toHaveClass("used");
    expect(chips[1]).toHaveClass("used");
    expect(checkBtn).toBeDisabled();

    // remove the first one — it should return to the pool, usable again
    fireEvent.click(slots[0]);
    expect(chips[0]).not.toHaveClass("used");
    expect(chips[1]).toHaveClass("used"); // the other placement is untouched
    expect(checkBtn).toBeDisabled(); // only 1 of 3 slots filled now

    // fill all 3 back up
    fireEvent.click(chips[0]);
    fireEvent.click(chips[2]);
    expect(checkBtn).not.toBeDisabled();

    // never auto-checks — onResolve only fires on an explicit press
    expect(onResolve).not.toHaveBeenCalled();
    fireEvent.click(checkBtn);
    expect(onResolve).toHaveBeenCalledTimes(1);
  });
});
