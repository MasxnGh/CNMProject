export default function ChipSlots({ slots, chipRegistry, nextIndex, onSlotClick, slotStatus, disabled }) {
  return (
    <div className="chipSlotsRow">
      {slots.map((chipId, index) => {
        const chip = chipId ? chipRegistry.get(chipId) : null;
        const status = slotStatus?.[index];
        const className = [
          "chipSlot",
          chip && "filled",
          !chip && index === nextIndex && "next",
          status,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={index} className={className}>
            {chip && (
              <button
                type="button"
                className="wordChip"
                data-chip-id={chip.id}
                onClick={() => onSlotClick(index)}
                disabled={disabled}
              >
                {chip.hanzi}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
