import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { ProgressBar } from '../hud/ProgressBar'
import { DEMO_STORAGE } from '../../data/demo'
import type { SystemMetrics } from '../../api/client'
import styles from './StoragePanel.module.css'

interface Props { disks: SystemMetrics['disk'] | null }

export function StoragePanel({ disks }: Props) {
  const isReal = !!disks && disks.length > 0

  const items = isReal
    ? disks!.map(d => ({
        label: `${d.mountpoint} (${d.device.split('\\').slice(-1)[0] ?? d.device})`,
        value: d.percent,
        caption: `${d.used_gb} / ${d.total_gb} GB`,
        color: d.percent > 85 ? 'var(--red)' : d.percent > 65 ? 'var(--amber)' : 'var(--orange)',
      }))
    : DEMO_STORAGE.map(item => ({
        label: item.label,
        value: (item.used / item.total) * 100,
        caption: `${item.used} GB / ${item.total} GB`,
        color: item.color,
      }))

  return (
    <Panel
      title="Storage"
      aria-label={`Storage panel${isReal ? '' : ' — demo data'}`}
      badge={isReal ? undefined : <DemoBadge />}
    >
      <div className={styles.bars}>
        {items.map(item => (
          <ProgressBar key={item.label} label={item.label}
            value={item.value} color={item.color} caption={item.caption} />
        ))}
      </div>
      {!isReal && <p className={styles.note}>Values are demo placeholders. Backend offline.</p>}
    </Panel>
  )
}
