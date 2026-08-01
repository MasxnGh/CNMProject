/**
 * dujeen-quest-prototype.html .btn - thick bottom-edge box-shadow that
 * disappears on press (translateY matches the shadow depth exactly, so the
 * button visually sinks into the shadow instead of just moving).
 */
export default function Button({
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const variantClass = variant === "ghost" ? "ln-btn ghost" : "ln-btn";

  return (
    <button
      type={type}
      className={`${variantClass}${className ? ` ${className}` : ""}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
