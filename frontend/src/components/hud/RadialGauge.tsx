interface RadialGaugeProps {
  label: string
  value: number     // 0-100
  unit: string
  color: string     // CSS color value
  size?: number     // px
}

/** Radial/arc gauge rendered as inline SVG. */
export function RadialGauge({ label, value, unit, color, size = 90 }: RadialGaugeProps) {
  const cx = size / 2
  const cy = size / 2
  const r  = (size / 2) - 8
  const circumference = 2 * Math.PI * r
  // Arc goes from -220deg to +40deg (240 degrees of arc = 2/3 of circle)
  const arcFraction = 240 / 360
  const arcLength   = circumference * arcFraction
  const dashOffset  = arcLength - (arcLength * Math.min(value, 100)) / 100
  const rotation    = -210  // start angle offset

  const clampedValue = Math.min(Math.max(value, 0), 100)

  return (
    <figure
      className="radial-gauge"
      aria-label={`${label}: ${clampedValue}${unit} (demo data)`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        width: `${size}px`,
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-hidden="true"
        overflow="visible"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,122,26,0.12)"
          strokeWidth="5"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={0}
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        {/* Value text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size < 90 ? 13 : 16}
          fontFamily="var(--font-mono)"
          fontWeight="700"
        >
          {clampedValue}
        </text>
        <text
          x={cx}
          y={cy + (size < 90 ? 10 : 13)}
          textAnchor="middle"
          fill="rgba(244,233,220,0.5)"
          fontSize={size < 90 ? 7 : 8}
          fontFamily="var(--font-display)"
          letterSpacing="0.05em"
        >
          {unit}
        </text>
      </svg>
      <figcaption
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-xs)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {label}
      </figcaption>
    </figure>
  )
}
