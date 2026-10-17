interface WaveformStaticProps {
  width?: number
  height?: number
  color?: string
}

/**
 * Static flat waveform graphic — for visual decoration only.
 * No microphone access. No animation beyond gentle opacity pulse.
 */
export function WaveformStatic({ width = 200, height = 40, color = 'var(--orange)' }: WaveformStaticProps) {
  // Predefined static bars (not live)
  const bars = [
    3, 6, 4, 9, 12, 8, 5, 7, 10, 14, 11, 7, 5, 8, 6, 10, 13, 9, 6, 4,
    3, 7, 11, 8, 5, 9, 7, 12, 9, 6, 4, 8, 11, 7, 5, 6, 9, 12, 8, 4,
  ]

  const barW = (width - bars.length) / bars.length
  const maxH = height - 4

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-label="Static waveform graphic (decorative, voice input not active)"
      role="img"
      style={{ opacity: 0.6 }}
    >
      {bars.map((h, i) => {
        const barHeight = Math.max(2, (h / 14) * maxH)
        const x = i * (barW + 1)
        const y = (height - barHeight) / 2
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(1, barW)}
            height={barHeight}
            fill={color}
            rx="1"
            opacity={(0.3 + (h / 14) * 0.7).toFixed(2)}
          />
        )
      })}
    </svg>
  )
}
