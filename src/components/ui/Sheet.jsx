import "./Sheet.css";

/** Centered overlay modal. Put <Sheet.Actions> children as the button row. */
export default function Sheet({ open, onClose, title, children, closeOnBackdrop = true }) {
  if (!open) return null;
  return (
    <div
      className="sheet-overlay"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

Sheet.Actions = function SheetActions({ children }) {
  return <div className="sheet-actions">{children}</div>;
};
