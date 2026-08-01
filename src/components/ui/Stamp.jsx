/**
 * dujeen-quest-prototype.html .stampPop - the red seal bounce-in: starts
 * big and tilted, overshoots small, settles into its final rotation. `size`
 * lets the same component serve the big celebratory overlay and the small
 * per-node/collection badges (prototype's .tiny/.sm), which share the same
 * glyph and color but not the same dimensions.
 */
export default function Stamp({ glyph = "过", size = 150, className = "" }) {
  return (
    <div
      className={`ln-stamp${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.373 }}
      aria-hidden="true"
    >
      {glyph}
    </div>
  );
}
