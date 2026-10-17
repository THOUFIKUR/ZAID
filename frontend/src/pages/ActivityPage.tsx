import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { getActivity, clearActivity } from '../api/client'
import type { ActivityEntry } from '../api/client'
import styles from './ActivityPage.module.css'

const CAT_COLORS: Record<string, string> = {
  chat:    'var(--orange)',
  files:   'var(--cyan)',
  desktop: 'var(--amber)',
  memory:  'var(--red)',
  system:  'var(--text-dim)',
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [backendOnline, setBackendOnline] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getActivity(100, filterCat || undefined)
      setEntries(res.entries)
      setBackendOnline(true)
    } catch { setBackendOnline(false) }
    finally { setLoading(false) }
  }, [filterCat])

  useEffect(() => { load() }, [load])

  const handleClear = async () => {
    if (!confirm('Clear all activity logs?')) return
    await clearActivity()
    setEntries([])
  }

  const fmt = (ts: number) => new Date(ts * 1000).toLocaleString()
  const cats = ['', 'chat', 'files', 'desktop', 'memory', 'system']

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Activity</h1>
            <p className={styles.sub}>All ZAID actions logged locally — never sent anywhere</p>
          </div>
          <div className={styles.headerRight}>
            {backendOnline
              ? <StatusBadge variant="connected" label="CONNECTED" />
              : <StatusBadge variant="disconnected" label="BACKEND OFFLINE" />}
            <button className={styles.refreshBtn} onClick={load} aria-label="Refresh activity log">↺</button>
          </div>
        </header>

        {/* Category filter */}
        <div className={styles.filterRow}>
          {cats.map(c => (
            <button key={c} className={`${styles.filterBtn} ${filterCat === c ? styles.active : ''}`}
              style={filterCat === c && c ? { borderColor: CAT_COLORS[c], color: CAT_COLORS[c] } : {}}
              onClick={() => setFilterCat(c)}>
              {c || 'All'}
            </button>
          ))}
          {entries.length > 0 && (
            <button className={styles.clearBtn} onClick={handleClear}>Clear Log</button>
          )}
        </div>

        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : !backendOnline ? (
          <EmptyState icon="📋" title="Backend offline"
            description="Activity is logged when the backend is running." />
        ) : entries.length === 0 ? (
          <EmptyState icon="📋" title="No activity yet"
            description="Actions (chat, file reads, app launches) will appear here." />
        ) : (
          <ul className={styles.list} aria-label="Activity log">
            {entries.map(e => (
              <li key={e.id} className={styles.entry}>
                <span className={styles.cat}
                  style={{ color: CAT_COLORS[e.category] ?? 'var(--text-dim)' }}>
                  {e.category}
                </span>
                <span className={styles.desc}>{e.description}</span>
                <time className={styles.time}>{fmt(e.timestamp)}</time>
                {Object.keys(e.meta).length > 0 && (
                  <details className={styles.meta}>
                    <summary>details</summary>
                    <pre>{JSON.stringify(e.meta, null, 2)}</pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
