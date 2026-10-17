import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { StatusBadge } from '../components/common/StatusBadge'
import { getFileRoots, listDirectory, readFile } from '../api/client'
import type { FileEntry } from '../api/client'
import styles from './FilesPage.module.css'

type View = 'roots' | 'dir' | 'file'

interface NavEntry { path: string; name: string }

const ICONS: Record<string, string> = {
  '.pdf': '📄', '.txt': '📝', '.md': '📝', '.json': '🔧',
  '.js': '📜', '.ts': '📜', '.tsx': '📜', '.py': '🐍',
  '.png': '🖼', '.jpg': '🖼', '.jpeg': '🖼', '.gif': '🖼',
  '.mp3': '🎵', '.mp4': '🎬', '.zip': '📦', '.csv': '📊',
  folder: '📁',
}
function icon(entry: FileEntry) {
  if (entry.is_dir) return ICONS.folder
  return ICONS[entry.extension ?? ''] ?? '📄'
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

export default function FilesPage() {
  const [view, setView] = useState<View>('roots')
  const [roots, setRoots] = useState<{ path: string; name: string }[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<NavEntry[]>([])
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [fileContent, setFileContent] = useState<{ name: string; content: string; mime: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  useEffect(() => {
    setLoading(true)
    getFileRoots()
      .then(r => { setRoots(r.roots); setBackendOnline(true) })
      .catch(e => { setError(e.message); setBackendOnline(false) })
      .finally(() => setLoading(false))
  }, [])

  const openDir = useCallback(async (path: string, name: string) => {
    setLoading(true); setError(null); setFileContent(null)
    try {
      const res = await listDirectory(path)
      setEntries(res.entries)
      setView('dir')
      setBreadcrumbs(prev => {
        const idx = prev.findIndex(b => b.path === path)
        return idx >= 0 ? prev.slice(0, idx + 1) : [...prev, { path, name }]
      })
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  const openFile = useCallback(async (path: string) => {
    setLoading(true); setError(null)
    try {
      const res = await readFile(path)
      setFileContent({ name: res.name, content: res.content, mime: res.mime ?? 'text/plain' })
      setView('file')
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  const goHome = () => { setView('roots'); setBreadcrumbs([]); setFileContent(null); setError(null) }
  const goBreadcrumb = (b: NavEntry) => openDir(b.path, b.name)

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Files</h1>
          <div className={styles.status}>
            {backendOnline === null && <StatusBadge variant="unavailable" label="CHECKING…" />}
            {backendOnline === true  && <StatusBadge variant="connected" label="CONNECTED" />}
            {backendOnline === false && <StatusBadge variant="disconnected" label="BACKEND OFFLINE" />}
            <span className={styles.readOnly}>READ-ONLY · APPROVED FOLDERS ONLY</span>
          </div>
        </header>

        {/* Breadcrumb nav */}
        {view !== 'roots' && (
          <nav className={styles.breadcrumb} aria-label="File path">
            <button onClick={goHome} className={styles.crumb}>Home</button>
            {breadcrumbs.map((b, i) => (
              <span key={b.path}>
                <span className={styles.sep}>/</span>
                {i < breadcrumbs.length - 1
                  ? <button onClick={() => goBreadcrumb(b)} className={styles.crumb}>{b.name}</button>
                  : <span className={styles.crumbCurrent}>{b.name}</span>}
              </span>
            ))}
            {view === 'file' && fileContent && (
              <span><span className={styles.sep}>/</span>
              <span className={styles.crumbCurrent}>{fileContent.name}</span></span>
            )}
          </nav>
        )}

        {loading && <p className={styles.loading}>Loading…</p>}
        {error && <div className={styles.error} role="alert">⚠ {error}</div>}

        {!loading && !error && (
          <div className={styles.content}>
            {/* Root list */}
            {view === 'roots' && (
              <div className={styles.grid}>
                {roots.map(r => (
                  <button key={r.path} className={styles.rootCard}
                    onClick={() => openDir(r.path, r.name)}>
                    <span className={styles.rootIcon}>📂</span>
                    <span className={styles.rootName}>{r.name}</span>
                    <span className={styles.rootPath}>{r.path}</span>
                  </button>
                ))}
                {backendOnline === false && (
                  <p className={styles.offline}>Backend offline. Start uvicorn to browse files.</p>
                )}
              </div>
            )}

            {/* Directory listing */}
            {view === 'dir' && (
              <table className={styles.table} aria-label="Directory contents">
                <thead><tr>
                  <th>Name</th><th>Size</th><th>Modified</th>
                </tr></thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.path} className={styles.row}
                      onClick={() => e.is_dir ? openDir(e.path, e.name) : (e.readable ? openFile(e.path) : undefined)}
                      style={{ cursor: e.readable || e.is_dir ? 'pointer' : 'not-allowed', opacity: e.readable || e.is_dir ? 1 : 0.4 }}
                      title={!e.readable && !e.is_dir ? 'This file type cannot be read' : undefined}
                    >
                      <td className={styles.nameCell}>
                        <span className={styles.fileIcon}>{icon(e)}</span>
                        {e.name}
                      </td>
                      <td>{e.is_dir ? '—' : fmtSize(e.size_bytes)}</td>
                      <td>{e.modified ? new Date(e.modified * 1000).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={3} className={styles.empty}>Empty folder</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* File viewer */}
            {view === 'file' && fileContent && (
              <div className={styles.fileViewer}>
                <div className={styles.fileHeader}>
                  <span className={styles.fileName}>{fileContent.name}</span>
                  <span className={styles.fileMime}>{fileContent.mime}</span>
                </div>
                <pre className={styles.fileContent}><code>{fileContent.content}</code></pre>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
