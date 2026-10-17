import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <AppShell showRail={false}>
      <div className={styles.page}>
        <div className={styles.orb} aria-hidden="true">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <circle cx="60" cy="60" r="54" stroke="var(--border-strong)" strokeWidth="2" fill="none" />
            <circle cx="60" cy="60" r="36" stroke="var(--orange)" strokeWidth="1.5" fill="none" strokeDasharray="8 4" />
            <circle cx="60" cy="60" r="18" fill="none" stroke="var(--red)" strokeWidth="1" />
            <text x="60" y="52" textAnchor="middle" fill="var(--red)" fontSize="24" fontFamily="var(--font-display)" fontWeight="700">4</text>
            <text x="60" y="76" textAnchor="middle" fill="var(--orange)" fontSize="24" fontFamily="var(--font-display)" fontWeight="700">04</text>
          </svg>
        </div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          ZAID could not locate this page. It may not exist yet, or the route has changed.
        </p>
        <Link to="/" className={styles.homeLink}>
          ← Return to Overview
        </Link>
      </div>
    </AppShell>
  )
}
