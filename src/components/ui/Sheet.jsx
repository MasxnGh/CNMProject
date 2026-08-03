import "./Sheet.css";

export default function Sheet({ open, onClose, title, description, children }) {
  if (!open) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  return (
    <div className="dim" onClick={handleBackdropClick}>
      <div className="sheet">
        {title && <h3>{title}</h3>}
        {description && <p>{description}</p>}
        {children}
      </div>
    </div>
  );
}
