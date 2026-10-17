import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { getMemories, addMemory, deleteMemory, clearMemories } from '../api/client'
import type { MemoryEntry } from '../api/client'
import styles from './MemoryPage.module.css'

const CATEGORIES = ['general', 'preference', 'fact', 'task', 'note']

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [filterCat, setFilterCat] = useState<string>('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendOnline, setBackendOnline] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getMemories(filterCat || undefined)
      setMemories(res.memories)
      setBackendOnline(true)
    } catch { setBackendOnline(false) }
    finally { setLoading(false) }
  }, [filterCat])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setSaving(true); setError(null)
    try {
      await addMemory(newContent.trim(), newCategory)
      setNewContent('')
      await load()
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await deleteMemory(id)
    setMemories(prev => prev.filter(m => m.id !== id))
  }

  const handleClearAll = async () => {
    if (!confirm('Clear all memories? This cannot be undone.')) return
    await clearMemories()
    setMemories([])
  }

  const fmt = (ts: number) => new Date(ts * 1000).toLocaleString()

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Memory</h1>
            <p className={styles.sub}>Stored locally in D:\ZAID\backend\memory_store.json — private, never sent anywhere</p>
          </div>
          {backendOnline
            ? <StatusBadge variant="connected" label="CONNECTED" />
            : <StatusBadge variant="disconnected" label="BACKEND OFFLINE" />}
        </header>

        {/* Add memory form */}
        {backendOnline && (
          <div className={styles.addForm}>
            <textarea className={styles.addInput} value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Type a memory to store… e.g. 'I prefer dark mode', 'Meeting at 3pm tomorrow'"
              rows={2} aria-label="New memory content" />
            <div className={styles.addRow}>
              <select className={styles.select} value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                aria-label="Memory category">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className={styles.addBtn} onClick={handleAdd}
                disabled={!newContent.trim() || saving}>
                {saving ? 'Saving…' : '+ Add Memory'}
              </button>
            </div>
            {error && <p className={styles.error}>⚠ {error}</p>}
          </div>
        )}

        {/* Filter */}
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Filter:</span>
          {['', ...CATEGORIES].map(c => (
            <button key={c} className={`${styles.filterBtn} ${filterCat === c ? styles.filterActive : ''}`}
              onClick={() => setFilterCat(c)}>
              {c || 'All'}
            </button>
          ))}
          {memories.length > 0 && (
            <button className={styles.clearBtn} onClick={handleClearAll}>Clear All</button>
          )}
        </div>

        {/* Memory list */}
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : !backendOnline ? (
          <EmptyState icon="🧠" title="Backend offline"
            description="Start the backend to use memory storage." />
        ) : memories.length === 0 ? (
          <EmptyState icon="🧠" title="No memories stored"
            description="Add memories above. They persist across sessions." />
        ) : (
          <ul className={styles.list} aria-label="Stored memories">
            {memories.map(m => (
              <li key={m.id} className={styles.memItem}>
                <div className={styles.memTop}>
                  <span className={styles.memCat}>{m.category}</span>
                  <time className={styles.memTime}>{fmt(m.created_at)}</time>
                </div>
                <p className={styles.memContent}>{m.content}</p>
                <button className={styles.deleteBtn} onClick={() => handleDelete(m.id)}
                  aria-label={`Delete memory: ${m.content.slice(0, 30)}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
