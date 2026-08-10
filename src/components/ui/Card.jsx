import "./Card.css";

export default function Card({ padding = "md", className = "", children, ...rest }) {
  const classes = ["card", padding !== "md" ? `pad-${padding}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
