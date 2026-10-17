import styles from './DemoBadge.module.css'

interface DemoBadgeProps {
  caption?: string
}

/** Marks demo/placeholder data — always visible; must appear near any fabricated values. */
export function DemoBadge({ caption }: DemoBadgeProps) {
  return (
    <span className={styles.badge} aria-label="This data is demo placeholder data, not real">
      <span className={styles.icon} aria-hidden="true">◈</span>
      <span>DEMO DATA</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </span>
  )
}
