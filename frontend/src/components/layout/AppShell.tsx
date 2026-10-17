import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { QuickLaunchRail } from './QuickLaunchRail'
import styles from './AppShell.module.css'

interface AppShellProps {
  children: ReactNode
  showRail?: boolean
}

/**
 * AppShell wraps non-Overview pages with TopBar + optional Quick Launch Rail.
 * Overview page has its own layout and does not use AppShell.
 */
export function AppShell({ children, showRail = true }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <TopBar minimal />
      <div className={styles.body}>
        {showRail && <QuickLaunchRail />}
        <main id="main-content" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
