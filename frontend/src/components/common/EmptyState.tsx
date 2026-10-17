import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
}

/** Shown when a panel has no content (e.g. SHOW_DEMO_DATA is false). */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className={styles.wrapper} aria-live="polite">
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}
