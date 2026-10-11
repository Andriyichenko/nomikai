/** Cartoon "ドロン" smoke: a ring of outlined puffs that bloom and fade. Pure CSS. */
const PUFFS = [
  { x: 50, y: 70, s: 34, dx: 0, dy: -26 },
  { x: 22, y: 78, s: 26, dx: -22, dy: -12 },
  { x: 78, y: 78, s: 28, dx: 22, dy: -14 },
  { x: 36, y: 58, s: 22, dx: -10, dy: -30 },
  { x: 66, y: 60, s: 24, dx: 12, dy: -28 },
  { x: 50, y: 88, s: 20, dx: 0, dy: 6 },
];

export default function Smoke({ delay = 0, scale = 1, className = "" }: { delay?: number; scale?: number; className?: string }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {PUFFS.map((p, i) => (
        <span
          key={i}
          className="puff"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s * scale,
              height: p.s * scale,
              animationDelay: `calc(var(--splash-wait, 0s) + ${delay + i * 0.04}s)`,
              "--dx": `${p.dx * scale}px`,
              "--dy": `${p.dy * scale}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
