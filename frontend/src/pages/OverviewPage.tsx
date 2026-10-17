import { TopBar } from '../components/layout/TopBar'
import { QuickLaunchRail } from '../components/layout/QuickLaunchRail'
import { BottomDock } from '../components/layout/BottomDock'
import { IntegrationsPanel } from '../components/panels/IntegrationsPanel'
import { CoreOrb } from '../components/hud/CoreOrb'
import { SystemStatusPanel } from '../components/panels/SystemStatusPanel'
import { LocalModelPanel } from '../components/panels/LocalModelPanel'
import { StoragePanel } from '../components/panels/StoragePanel'
import { NetworkPanel } from '../components/panels/NetworkPanel'
import { ActiveTasksPanel } from '../components/panels/ActiveTasksPanel'
import { UpcomingEventsPanel } from '../components/panels/UpcomingEventsPanel'
import { RecentActivityPanel } from '../components/panels/RecentActivityPanel'
import { VoicePanel } from '../components/panels/VoicePanel'
import { WeatherCard } from '../components/panels/WeatherCard'
import { useSystemMetrics } from '../hooks/useSystemMetrics'
import styles from './OverviewPage.module.css'

export default function OverviewPage() {
  const sys = useSystemMetrics()

  return (
    <div className={styles.page}>
      {/* Scanline overlay — decorative */}
      <div className="scanlines" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1 }} />

      {/* Circuit grid background */}
      <div className={styles.circuitBg} aria-hidden="true" />

      {/* TOP BAR */}
      <TopBar />

      {/* MAIN GRID */}
      <div className={styles.grid}>
        {/* LEFT RAIL: Quick Launch */}
        <aside className={styles.leftRail} aria-label="Quick Launch">
          <QuickLaunchRail />
        </aside>

        {/* LEFT COLUMN */}
        <aside className={styles.leftCol} aria-label="System panels">
          <SystemStatusPanel metrics={sys.metrics} />
          <LocalModelPanel ollamaConnected={sys.ollamaConnected} metrics={sys.metrics} />
          <StoragePanel disks={sys.metrics?.disk ?? null} />
        </aside>

        {/* CENTRE: CoreOrb */}
        <main id="main-content" className={styles.centre} tabIndex={-1}
          aria-label={sys.ollamaConnected ? 'ZAID AI Core — Connected' : 'ZAID AI Core — UI Preview'}>
          <CoreOrb connected={sys.ollamaConnected} />

          {/* Decorative ANALYZE strip */}
          <div className={styles.analyzeStrip} aria-hidden="true" role="presentation">
            ANALYZE&nbsp;·&nbsp; PLAN &nbsp;·&nbsp; EXECUTE
          </div>
        </main>

        {/* RIGHT COLUMN */}
        <aside className={styles.rightCol} aria-label="Status panels">
          <WeatherCard />
          <NetworkPanel network={sys.metrics?.network ?? null} />
          <ActiveTasksPanel />
          <UpcomingEventsPanel />
        </aside>

        {/* RIGHT RAIL: Integrations */}
        <aside className={styles.rightRail} aria-label="Integrations">
          <IntegrationsPanel />
        </aside>
      </div>

      {/* BOTTOM AREA */}
      <footer className={styles.bottom} role="contentinfo">
        {/* Bottom-left: Voice Panel */}
        <div className={styles.bottomLeft}>
          <VoicePanel />
        </div>

        {/* Bottom-centre: Dock */}
        <div className={styles.bottomCentre}>
          <BottomDock />
        </div>

        {/* Bottom-right: Recent Activity + decorative globe */}
        <div className={styles.bottomRight}>
          <RecentActivityPanel />
          <div className={styles.globeCaption} aria-label="This preview makes no network requests">
            <svg viewBox="0 0 60 60" width="48" height="48" aria-hidden="true" className="decorative-animate">
              <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,122,26,0.3)" strokeWidth="1.5" />
              <ellipse cx="30" cy="30" rx="12" ry="26" fill="none" stroke="rgba(255,122,26,0.2)" strokeWidth="1" />
              <ellipse cx="30" cy="30" rx="26" ry="10" fill="none" stroke="rgba(255,122,26,0.2)" strokeWidth="1" />
              <line x1="4" y1="30" x2="56" y2="30" stroke="rgba(255,122,26,0.15)" strokeWidth="1" />
              <line x1="30" y1="4" x2="30" y2="56" stroke="rgba(255,122,26,0.15)" strokeWidth="1" />
              <circle cx="30" cy="30" r="3" fill="rgba(255,122,26,0.4)" />
            </svg>
            <span className={styles.globeText}>No network requests</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
