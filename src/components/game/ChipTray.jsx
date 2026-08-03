export default function ChipTray({ tray, chipRegistry, onChipClick, disabled }) {
  return (
    <div className="chipTrayRow">
      {tray.map((chipId) => {
        const chip = chipRegistry.get(chipId);
        if (!chip) return null;
        return (
          <button
            key={chipId}
            type="button"
            className="wordChip"
            data-chip-id={chipId}
            onClick={() => onChipClick(chipId)}
            disabled={disabled}
          >
            {chip.hanzi}
          </button>
        );
      })}
    </div>
  );
}
