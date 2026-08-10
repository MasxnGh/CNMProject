import "./Chip.css";

/** Small pill tag. Pass `c`/`cl` (css var strings, e.g. "var(--verm)") to color it. */
export default function Chip({ c, cl, className = "", children, ...rest }) {
  const toned = Boolean(c && cl);
  const classes = ["chip", toned ? "tone" : "", className].filter(Boolean).join(" ");
  const style = toned ? { "--c": c, "--cl": cl } : undefined;
  return (
    <span className={classes} style={style} {...rest}>
      {children}
    </span>
  );
}
