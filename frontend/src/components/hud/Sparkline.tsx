interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillOpacity?: number
  label?: string
}

/**
 * Sparkline chart rendered as inline SVG path.
 * No external chart library — just math and SVG.
 */
export function Sparkline({
  data,
  width = 200,
  height = 40,
  color = 'var(--orange)',
  fillOpacity = 0.15,
  label = 'Sparkline chart (demo data)',
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 4

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }))

  // Build smooth polyline path
  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`))
    .join(' ')

  // Fill path closes to bottom
  const fillPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height - pad} L${pad},${height - pad} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-label={label}
      role="img"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 2} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path d={fillPath} fill="url(#spark-fill)" />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}
