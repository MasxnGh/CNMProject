/**
 * dujeen-quest-prototype.html .dim/.sheet - slides up from the bottom on
 * mobile, becomes a centered modal at tablet width and up (see
 * lantern-ui.css's @media(min-width:720px) override on .dim/.sheet).
 * Clicking the dim backdrop itself (not the sheet) closes it.
 */
export default function Sheet({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      className="ln-dim on"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="ln-sheet" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
