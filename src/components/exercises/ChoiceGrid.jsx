export default function ChoiceGrid({
  choices,
  selected,
  correctId,
  checked,
  onPick,
  renderChoice,
  optClassName = "",
  getChoiceStyle,
}) {
  return (
    <div className="grid">
      {choices.map((choice) => {
        const isSelected = selected === choice.id;
        const isCorrectChoice = checked && choice.id === correctId;
        const isWrongPick = checked && isSelected && choice.id !== correctId;

        let stateClass = "";
        if (isCorrectChoice) stateClass = "good";
        else if (isWrongPick) stateClass = "bad";
        else if (!checked && isSelected) stateClass = "sel";

        return (
          <button
            key={choice.id}
            type="button"
            className={["opt", optClassName, stateClass].filter(Boolean).join(" ")}
            style={getChoiceStyle ? getChoiceStyle(choice) : undefined}
            onClick={() => onPick(choice.id)}
            disabled={checked}
          >
            {renderChoice(choice)}
          </button>
        );
      })}
    </div>
  );
}
