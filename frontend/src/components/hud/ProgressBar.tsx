interface ProgressBarProps {
  label: string
  value: number     // 0-100 percentage
  color?: string
  showValue?: boolean
  caption?: string
}

/** Horizontal progress bar with label and optional value display. */
export function ProgressBar({ label, value, color = 'var(--orange)', showValue = true, caption }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-xs)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
        }}>
          {label}
        </span>
        {showValue && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-xs)',
            color,
          }}>
            {pct.toFixed(0)}%
          </span>
        )}
      </div>
      {caption && (
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-dim)',
        }}>
          {caption}
        </span>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct.toFixed(0)}%`}
        style={{
          height: '6px',
          background: 'rgba(255,122,26,0.12)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 'var(--radius-full)',
            boxShadow: `0 0 6px ${color}`,
            transition: 'width var(--dur-slow) var(--ease)',
          }}
        />
      </div>
    </div>
  )
}
