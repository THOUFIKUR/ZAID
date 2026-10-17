import styles from './CoreOrb.module.css'

interface Props { connected?: boolean }

/**
 * CoreOrb — the central AI visual.
 * When connected=true, updates caption and status to reflect live AI connection.
 */
export function CoreOrb({ connected = false }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.caption}
        aria-label={connected ? 'ZAID AI Core — Online' : 'UI Preview - AI core not connected'}>
        {connected ? 'AI CORE — ONLINE' : 'UI PREVIEW — AI CORE NOT CONNECTED'}
      </div>

      <div className={styles.orbContainer}>
        {/* Outer glow rings (CSS animated) */}
        <div className={`${styles.glowRing} ${styles.glowRing1} decorative-animate`} aria-hidden="true" />
        <div className={`${styles.glowRing} ${styles.glowRing2} decorative-animate`} aria-hidden="true" />

        <svg
          viewBox="0 0 400 400"
          className={styles.svg}
          aria-hidden="true"
          role="img"
        >
          <defs>
            {/* Starfield/dotted texture pattern */}
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill="rgba(255,122,26,0.25)" />
              <circle cx="0"  cy="0"  r="0.5" fill="rgba(255,59,47,0.15)" />
              <circle cx="20" cy="0"  r="0.5" fill="rgba(255,59,47,0.15)" />
              <circle cx="0"  cy="20" r="0.5" fill="rgba(255,59,47,0.15)" />
              <circle cx="20" cy="20" r="0.5" fill="rgba(255,59,47,0.15)" />
            </pattern>

            {/* Radial gradient for core glow */}
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ff7a1a" stopOpacity="0.9" />
              <stop offset="40%"  stopColor="#ff3b2f" stopOpacity="0.5" />
              <stop offset="70%"  stopColor="#b3140c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#050505" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffb000" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#050505" stopOpacity="0" />
            </radialGradient>

            {/* Radar sweep gradient */}
            <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(255,122,26,0.4)" />
              <stop offset="100%" stopColor="rgba(255,122,26,0)" />
            </radialGradient>
          </defs>

          {/* Background fill */}
          <circle cx="200" cy="200" r="200" fill="url(#outerGlow)" />

          {/* Dotted texture */}
          <circle cx="200" cy="200" r="190" fill="url(#dots)" />

          {/* Outer tick-ring */}
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = (i * 5) * (Math.PI / 180)
            const isMajor = i % 6 === 0
            const r1 = isMajor ? 182 : 186
            const r2 = 190
            return (
              <line
                key={i}
                x1={200 + r1 * Math.cos(angle)}
                y1={200 + r1 * Math.sin(angle)}
                x2={200 + r2 * Math.cos(angle)}
                y2={200 + r2 * Math.sin(angle)}
                stroke={isMajor ? 'rgba(255,122,26,0.6)' : 'rgba(255,122,26,0.25)'}
                strokeWidth={isMajor ? 1.5 : 0.8}
              />
            )
          })}

          {/* Ring 1 — outermost segmented arc (red) */}
          <circle cx="200" cy="200" r="170"
            fill="none" stroke="rgba(255,59,47,0.15)" strokeWidth="1" />
          <circle cx="200" cy="200" r="170"
            fill="none" stroke="rgba(255,59,47,0.7)" strokeWidth="2"
            strokeDasharray="12 6"
            className={`decorative-animate ${styles.rotCw}`} />

          {/* Ring 2 (orange) */}
          <circle cx="200" cy="200" r="150"
            fill="none" stroke="rgba(255,122,26,0.12)" strokeWidth="1" />
          <circle cx="200" cy="200" r="150"
            fill="none" stroke="rgba(255,122,26,0.65)" strokeWidth="1.5"
            strokeDasharray="8 4"
            className={`decorative-animate ${styles.rotCcw}`} />

          {/* Ring 3 (amber) */}
          <circle cx="200" cy="200" r="130"
            fill="none" stroke="rgba(255,176,0,0.55)" strokeWidth="1.5"
            strokeDasharray="24 8"
            className={`decorative-animate ${styles.rotCw}`} />

          {/* Ring 4 — cyan accent */}
          <circle cx="200" cy="200" r="110"
            fill="none" stroke="rgba(53,208,230,0.5)" strokeWidth="1"
            strokeDasharray="6 12"
            className={`decorative-animate ${styles.rotCcw}`} />

          {/* Ring 5 (gold) */}
          <circle cx="200" cy="200" r="90"
            fill="none" stroke="rgba(255,209,102,0.35)" strokeWidth="1"
            strokeDasharray="3 9" />

          {/* Radar sweep sector */}
          <g className={`decorative-animate ${styles.radarSweep}`} style={{ transformOrigin: '200px 200px' }}>
            <path
              d="M200 200 L200 60 A140 140 0 0 1 310 270 Z"
              fill="url(#sweepGrad)"
              opacity="0.25"
            />
          </g>

          {/* Cross-hair lines */}
          <line x1="60"  y1="200" x2="340" y2="200" stroke="rgba(255,122,26,0.1)" strokeWidth="1" />
          <line x1="200" y1="60"  x2="200" y2="340" stroke="rgba(255,122,26,0.1)" strokeWidth="1" />
          <line x1="101" y1="101" x2="299" y2="299" stroke="rgba(255,122,26,0.07)" strokeWidth="0.8" />
          <line x1="299" y1="101" x2="101" y2="299" stroke="rgba(255,122,26,0.07)" strokeWidth="0.8" />

          {/* Inner glow disc */}
          <circle cx="200" cy="200" r="70" fill="url(#coreGlow)" className={`decorative-animate ${styles.pulse}`} />

          {/* Inner solid core rings */}
          <circle cx="200" cy="200" r="50"
            fill="none" stroke="rgba(255,122,26,0.5)" strokeWidth="2" />
          <circle cx="200" cy="200" r="35"
            fill="none" stroke="rgba(255,59,47,0.4)" strokeWidth="1.5" />

          {/* Core fill */}
          <circle cx="200" cy="200" r="25" fill="#140d09" stroke="var(--orange)" strokeWidth="2" />
          <circle cx="200" cy="200" r="14" fill="rgba(255,122,26,0.2)" />
          <circle cx="200" cy="200" r="6"  fill="rgba(255,176,0,0.8)" />

          {/* Cardinal labels */}
          {[['N','200','28'],['E','376','206'],['S','200','382'],['W','26','206']].map(([l,x,y]) => (
            <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,122,26,0.4)" fontSize="9" fontFamily="var(--font-display)"
              letterSpacing="0.1em">{l}</text>
          ))}
        </svg>
      </div>

      <div className={styles.status}>
        <span className={styles.statusDot} aria-hidden="true" />
        AI ENGINE NOT CONNECTED
      </div>
    </div>
  )
}
