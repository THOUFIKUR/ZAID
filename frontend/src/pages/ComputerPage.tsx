import { useState, useEffect } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { StatusBadge } from '../components/common/StatusBadge'
import { getApprovedApps, launchApp, getProcesses } from '../api/client'
import styles from './ComputerPage.module.css'

interface App { id: string; label: string; available: boolean }
interface Process { pid: number; name: string; cpu_pct: number; mem_pct: number }

const APP_ICONS: Record<string, string> = {
  notepad: '📝', calculator: '🔢', explorer: '📂', paint: '🎨',
  wordpad: '📄', terminal: '⬛', powershell: '💙', vscode: '🔵',
  chrome: '🌐', firefox: '🦊', edge: '🔷',
}

export default function ComputerPage() {
  const [apps, setApps] = useState<App[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [launchStatus, setLaunchStatus] = useState<Record<string, string>>({})
  const [showProcesses, setShowProcesses] = useState(false)
  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(false)

  useEffect(() => {
    getApprovedApps()
      .then(r => { setApps(r.apps); setBackendOnline(true) })
      .catch(() => setBackendOnline(false))
      .finally(() => setLoading(false))
  }, [])

  const handleLaunch = async (app: App) => {
    if (!app.available) return
    setLaunchStatus(prev => ({ ...prev, [app.id]: 'launching…' }))
    try {
      await launchApp(app.id)
      setLaunchStatus(prev => ({ ...prev, [app.id]: '✓ launched' }))
    } catch (e) {
      setLaunchStatus(prev => ({ ...prev, [app.id]: `⚠ ${(e as Error).message}` }))
    }
    setTimeout(() => {
      setLaunchStatus(prev => { const n = {...prev}; delete n[app.id]; return n })
    }, 3000)
  }

  const handleShowProcesses = async () => {
    if (showProcesses) { setShowProcesses(false); return }
    const res = await getProcesses()
    setProcesses(res.processes)
    setShowProcesses(true)
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Computer</h1>
            <p className={styles.sub}>Launch approved apps · View running processes (read-only)</p>
          </div>
          {backendOnline
            ? <StatusBadge variant="connected" label="CONNECTED" />
            : <StatusBadge variant="disconnected" label="BACKEND OFFLINE" />}
        </header>

        <section>
          <h2 className={styles.sectionTitle}>Approved Applications</h2>
          <p className={styles.notice}>
            Only pre-approved apps can be launched. Edit <code>D:\ZAID\backend\config.py</code> APPROVED_APPS to add more.
          </p>
          {loading ? <p className={styles.loading}>Loading…</p> : (
            <div className={styles.appGrid}>
              {apps.map(app => (
                <button key={app.id} className={styles.appCard}
                  onClick={() => handleLaunch(app)}
                  disabled={!app.available || !backendOnline}
                  title={!app.available ? 'Executable not found on this system' : `Launch ${app.label}`}>
                  <span className={styles.appIcon}>{APP_ICONS[app.id] ?? '🖥'}</span>
                  <span className={styles.appLabel}>{app.label}</span>
                  {launchStatus[app.id] && (
                    <span className={styles.launchStatus}>{launchStatus[app.id]}</span>
                  )}
                  {!app.available && <span className={styles.unavailable}>Not found</span>}
                </button>
              ))}
              {!backendOnline && (
                <p className={styles.offline}>Start backend to launch apps.</p>
              )}
            </div>
          )}
        </section>

        <section>
          <div className={styles.procHeader}>
            <h2 className={styles.sectionTitle}>Running Processes</h2>
            <button className={styles.toggleBtn} onClick={handleShowProcesses} disabled={!backendOnline}>
              {showProcesses ? 'Hide' : 'Show top 50 by CPU'}
            </button>
          </div>
          {showProcesses && (
            <table className={styles.procTable} aria-label="Running processes">
              <thead><tr><th>PID</th><th>Name</th><th>CPU %</th><th>MEM %</th></tr></thead>
              <tbody>
                {processes.map(p => (
                  <tr key={p.pid}>
                    <td className={styles.pid}>{p.pid}</td>
                    <td>{p.name}</td>
                    <td style={{ color: p.cpu_pct > 20 ? 'var(--orange)' : 'inherit' }}>{p.cpu_pct.toFixed(1)}</td>
                    <td>{p.mem_pct.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </AppShell>
  )
}
