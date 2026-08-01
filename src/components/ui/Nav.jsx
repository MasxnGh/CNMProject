/**
 * dujeen-quest-prototype.html .rail - a full-width bottom bar on mobile and
 * tablet, becomes a 104px-wide left rail at desktop width (>=1080px, see
 * lantern-ui.css). Driven entirely by the --rail CSS variable; callers that
 * render <main> alongside this should pad-left: var(--rail) so content
 * clears the rail once it moves to the side.
 */
export default function Nav({ items, activeKey }) {
  return (
    <nav className="ln-rail">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={item.key === activeKey ? "on" : ""}
          onClick={item.onClick}
          disabled={item.disabled}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
