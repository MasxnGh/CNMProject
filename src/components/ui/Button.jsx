import "./Button.css";

const VARIANTS = ["primary", "ghost", "gold", "cel"];

export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  pulse = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...rest
}) {
  const v = VARIANTS.includes(variant) ? variant : "primary";
  const classes = [
    "btn",
    v !== "primary" ? `variant-${v}` : "",
    size === "sm" ? "size-sm" : "",
    block ? "block" : "",
    pulse ? "pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
