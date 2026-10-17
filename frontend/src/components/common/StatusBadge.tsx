import type { StatusVariant } from '../../types'
import { VisuallyHidden } from './VisuallyHidden'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  variant: StatusVariant
  label?: string
}

const CONFIG: Record<StatusVariant, { icon: string; defaultLabel: string; color: string }> = {
  connected:     { icon: '●', defaultLabel: 'Connected',     color: 'var(--status-connected)'     },
  disconnected:  { icon: '○', defaultLabel: 'Disconnected',  color: 'var(--status-disconnected)'  },
  unavailable:   { icon: '◆', defaultLabel: 'Unavailable',   color: 'var(--status-unavailable)'   },
  demo:          { icon: '◈', defaultLabel: 'Demo Data',     color: 'var(--status-demo)'          },
  unimplemented: { icon: '◇', defaultLabel: 'Unimplemented', color: 'var(--status-unimplemented)' },
}

/** Displays a status indicator with BOTH an icon and a text label — never colour alone. */
export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const { icon, defaultLabel, color } = CONFIG[variant]
  const text = label ?? defaultLabel

  return (
    <span
      className={styles.badge}
      data-variant={variant}
      aria-label={`Status: ${text}`}
      style={{ '--badge-color': color } as React.CSSProperties}
    >
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <span className={styles.label}>{text}</span>
      <VisuallyHidden>Status: {text}</VisuallyHidden>
    </span>
  )
}
