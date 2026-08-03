import "./Button.css";

export default function Button({ variant = "primary", className = "", children, ...props }) {
  const classes = ["btn", variant === "ghost" ? "ghost" : "", className].filter(Boolean).join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
