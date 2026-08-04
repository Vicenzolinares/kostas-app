interface ProgressRingProps {
  /** 0–100. Values outside the range are clamped. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * The circular completion gauge on each department TV.
 *
 * Hand-rolled SVG rather than a chart library: it's one arc with a label,
 * it has to stay legible from across a workshop, and Recharts' radial bar
 * brings a responsive-container/animation stack that fights a fixed-size
 * kiosk layout.
 */
export function ProgressRing({
  percent,
  size = 132,
  strokeWidth = 12,
  className,
}: ProgressRingProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Stroke is drawn from the top and clockwise via the -90deg rotation below.
  const dashOffset = circumference * (1 - safePercent / 100);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${safePercent}% complete`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-emerald-400 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div
        className="relative flex items-center justify-center"
        style={{ marginTop: -size, height: size }}
      >
        <span className="text-3xl font-bold tabular-nums text-white">
          {safePercent}%
        </span>
      </div>
    </div>
  );
}
