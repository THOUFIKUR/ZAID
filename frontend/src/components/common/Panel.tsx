import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title?: string
  children: ReactNode
  className?: string
  badge?: ReactNode
  'aria-label'?: string
}

/**
 * Base panel container with glowing border, corner brackets, and
 * optional title header. Used by all dashboard panels.
 */
export function Panel({ title, children, className = '', badge, 'aria-label': ariaLabel }: PanelProps) {
  return (
    <section
      className={`${styles.panel} corner-frame ${className}`}
      aria-label={ariaLabel ?? title}
    >
      {/* Scanline overlay — decorative, not interactive */}
      <div className="scanlines" aria-hidden="true" />

      {title && (
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {badge && <div className={styles.badge}>{badge}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
