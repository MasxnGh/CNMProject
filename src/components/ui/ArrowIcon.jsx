/**
 * One arrow path, symmetric about (32,32), rotated per direction via `transform`.
 * Drawing four separate arrows (instead of one path + rotation) is exactly how
 * you end up with the top/bottom pair looking mismatched — keep this single path.
 */
export default function ArrowIcon({ dx, dy, color = "#3F6BA8" }) {
  const rot = dx > 0 ? 0 : dx < 0 ? 180 : dy > 0 ? 90 : 270;
  return (
    <svg viewBox="0 0 64 64" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M46 32L34 44v-7H18v-10h16v-7z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
