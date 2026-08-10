import useReveal from "./useReveal.js";

/** Wraps children in the .rev/.in fade-up-on-scroll treatment from theme.css. */
export default function Reveal({ as: Tag = "div", delay, className = "", children, ...rest }) {
  const [ref, visible] = useReveal();
  const classes = ["rev", visible ? "in" : "", className].filter(Boolean).join(" ");
  const style = delay ? { transitionDelay: `${delay}ms`, ...rest.style } : rest.style;
  return (
    <Tag ref={ref} className={classes} {...rest} style={style}>
      {children}
    </Tag>
  );
}
