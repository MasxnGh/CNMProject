const RAD = Math.PI / 180;

/**
 * Real analog clock face. The hour hand is offset by `minute * 0.5deg` so it
 * visibly creeps between hour marks instead of snapping exactly to the hour.
 */
export default function ClockFace({ hour, minute, highlight }) {
  const hourAngle = ((hour % 12) * 30 + minute * 0.5 - 90) * RAD;
  const minuteAngle = (minute * 6 - 90) * RAD;
  const hx = 32 + 15 * Math.cos(hourAngle);
  const hy = 32 + 15 * Math.sin(hourAngle);
  const mx = 32 + 21 * Math.cos(minuteAngle);
  const my = 32 + 21 * Math.sin(minuteAngle);

  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * RAD;
    const x1 = 32 + 25 * Math.cos(a);
    const y1 = 32 + 25 * Math.sin(a);
    const x2 = 32 + 28 * Math.cos(a);
    const y2 = 32 + 28 * Math.sin(a);
    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B9AFA0" strokeWidth={i % 3 ? 1.2 : 2.4} />,
    );
  }

  return (
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill={highlight ? "#FAE3DE" : "#FFFDF8"} stroke={highlight ? "#CE4430" : "#241F1A"} strokeWidth="2.6" />
      {ticks}
      <line x1="32" y1="32" x2={hx} y2={hy} stroke="#241F1A" strokeWidth="3.6" strokeLinecap="round" />
      <line x1="32" y1="32" x2={mx} y2={my} stroke="#CE4430" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="2.8" fill="#CE4430" />
    </svg>
  );
}
