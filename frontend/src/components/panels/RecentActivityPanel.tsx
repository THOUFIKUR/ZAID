import { useState, useEffect } from 'react'
import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { getActivity } from '../../api/client'
import { DEMO_ACTIVITY } from '../../data/demo'
import type { DemoActivity } from '../../types'
import styles from './RecentActivityPanel.module.css'

const CAT_COLOR: Record<string, string> = {
  chat: 'var(--orange)', files: 'var(--cyan)',
  desktop: 'var(--amber)', memory: 'var(--red)',
}

function relTime(ts: number) {
  const diff = Math.floor((Date.now() / 1000) - ts)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export function RecentActivityPanel() {
  const [entries, setEntries] = useState<{ id: string; description: string; category: string; timestamp: number }[]>([])
  const [isReal, setIsReal] = useState(false)

  useEffect(() => {
    getActivity(8)
      .then(r => { setEntries(r.entries); setIsReal(true) })
      .catch(() => setIsReal(false))
  }, [])

  const items = isReal ? entries : DEMO_ACTIVITY.map((a: DemoActivity, i: number) => ({
    id: String(i), description: a.text, category: a.type, timestamp: Date.now() / 1000
  }))

  return (
    <Panel
      title="Recent Activity"
      aria-label={`Recent activity${isReal ? '' : ' — demo data'}`}
      badge={isReal ? undefined : <DemoBadge />}
    >
      <ul className={styles.list}>
        {items.map(item => (
          <li key={item.id} className={styles.item}>
            <span className={styles.dot}
              style={{ background: CAT_COLOR[item.category] ?? 'var(--text-dim)' }}
              aria-hidden="true" />
            <span className={styles.text}>{item.description}</span>
            <time className={styles.time}>{relTime(item.timestamp)}</time>
          </li>
        ))}
        {items.length === 0 && (
          <li className={styles.empty}>No activity yet</li>
        )}
      </ul>
      {isReal && (
        <a href="/activity" className={styles.viewAll}>View all →</a>
      )}
    </Panel>
  )
}
