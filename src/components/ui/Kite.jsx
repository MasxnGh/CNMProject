/** Diamond kite glyph, reused for the hero and the how-to-play demo. */
export default function Kite({ c1, c2, className }) {
  return (
    <svg viewBox="0 0 100 150" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M50 6L92 56 50 118 8 56z" fill={c1} />
      <path d="M50 6L92 56 50 118z" fill={c2} />
      <path d="M50 6v112M8 56h84" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" />
      <path d="M50 118q6 8 0 14t0 14" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="44" cy="126" rx="5" ry="2.4" fill={c1} />
      <ellipse cx="56" cy="138" rx="5" ry="2.4" fill={c1} />
    </svg>
  );
}
