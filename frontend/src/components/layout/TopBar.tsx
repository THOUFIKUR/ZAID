import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MenuDrawer } from './MenuDrawer'
import styles from './TopBar.module.css'

function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

interface TopBarProps {
  minimal?: boolean
}

export function TopBar({ minimal = false }: TopBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const now = useClock()
  const location = useLocation()

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <>
      <header className={`${styles.bar} ${minimal ? styles.minimal : ''}`} role="banner">
        {/* Left: clock */}
        <div className={styles.left}>
          {/* Decorative radar SVG */}
          <svg className={`${styles.radar} decorative-animate`} viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">
            <circle cx="20" cy="20" r="18" stroke="var(--border-strong)" strokeWidth="1" fill="none" />
            <circle cx="20" cy="20" r="12" stroke="var(--border)" strokeWidth="0.8" fill="none" />
            <circle cx="20" cy="20" r="6" stroke="var(--orange)" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
            <line x1="20" y1="20" x2="20" y2="4" stroke="var(--orange)" strokeWidth="1" strokeOpacity="0.7" />
            <circle cx="20" cy="20" r="2" fill="var(--orange)" />
          </svg>
          <div className={styles.clock}>
            <time dateTime={now.toISOString()} className={styles.time}>{timeStr}</time>
            <span className={styles.date}>{dateStr}</span>
          </div>
        </div>

        {/* Centre: wordmark */}
        <div className={styles.centre}>
          {!minimal && (
            <div className={styles.tagline}>THINK &nbsp;|&nbsp; PLAN &nbsp;|&nbsp; EXECUTE</div>
          )}
          <Link to="/" className={styles.wordmark} aria-label="ZAID — go to overview">
            ZAID
          </Link>
          <div className={styles.subtitle}>PERSONAL AI SYSTEM</div>
        </div>

        {/* Right: mic status + menu */}
        <div className={styles.right}>
          <span className={styles.micOff} aria-label="Microphone: off">
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <line x1="3" y1="3" x2="17" y2="17" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
              <rect x="7" y="2" width="6" height="11" rx="3" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" />
              <path d="M5 10 Q5 15 10 15 Q15 15 15 10" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" />
              <line x1="10" y1="15" x2="10" y2="18" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className={styles.micLabel}>Mic: off</span>
          </span>
          <button
            id="menu-toggle"
            className={styles.menuBtn}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="menu-drawer"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
              <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
              <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
            </svg>
            Menu
          </button>
        </div>
      </header>

      <MenuDrawer
        open={drawerOpen}
        currentPath={location.pathname}
        onClose={() => setDrawerOpen(false)}
        triggerId="menu-toggle"
      />
    </>
  )
}
