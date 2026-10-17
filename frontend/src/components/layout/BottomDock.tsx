import { useNavigate, useLocation } from 'react-router-dom'
import styles from './BottomDock.module.css'

interface DockItem {
  id: string
  label: string
  path?: string
  disabled?: boolean
  isMic?: boolean
  icon: React.ReactNode
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'chat',       label: 'Chat',       path: '/chat',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M18 10c0 3.87-3.58 7-8 7a9 9 0 0 1-3-.5L2 18l1.5-4A6.9 6.9 0 0 1 2 10c0-3.87 3.58-7 8-7s8 3.13 8 7z"/></svg> },
  { id: 'computer',   label: 'Computer',   path: '/computer',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="3" width="16" height="11" rx="1.5"/><path d="M6 17h8M10 14v3"/></svg> },
  { id: 'files',      label: 'Files',      path: '/files',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2-2h3.5L10 5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"/></svg> },
  { id: 'phone',      label: 'Phone',      path: '/phone',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 2h4l2 5-2 2a12 12 0 0 0 3 3l2-2 5 2v4a2 2 0 0 1-2 2C7.16 18 2 12.84 2 4a2 2 0 0 1 2-2z"/></svg> },
  // Central mic — DISABLED
  { id: 'mic',        label: 'Voice',      disabled: true, isMic: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="2" width="6" height="13" rx="3"/>
      <path d="M5 10 Q5 18 12 18 Q19 18 19 10"/>
      <line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
      <line x1="3" y1="3" x2="21" y2="21" stroke="var(--red)" strokeWidth="2"/>
    </svg> },
  { id: 'messages',   label: 'Messages',   path: '/messages',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 4h16v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z"/><polyline points="2,4 10,11 18,4"/></svg> },
  { id: 'automation', label: 'Automation', path: '/automation',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 4l4 2-2 4 4 2 2-4 4 2-2 8H6L4 4z"/></svg> },
  { id: 'memory',     label: 'Memory',     path: '/memory',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="6" width="16" height="8" rx="1.5"/><line x1="6" y1="6" x2="6" y2="14"/><line x1="10" y1="6" x2="10" y2="14"/><line x1="14" y1="6" x2="14" y2="14"/><line x1="2" y1="9" x2="18" y2="9"/><line x1="2" y1="12" x2="18" y2="12"/></svg> },
  { id: 'settings',   label: 'Settings',   path: '/settings',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/></svg> },
]

export function BottomDock() {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <nav className={styles.dock} aria-label="Quick navigation dock">
      {DOCK_ITEMS.map(item => {
        const isActive = item.path
          ? (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))
          : false

        return (
          <button
            key={item.id}
            className={`${styles.btn} ${item.isMic ? styles.mic : ''} ${isActive ? styles.active : ''}`}
            onClick={() => { if (!item.disabled && item.path) navigate(item.path) }}
            disabled={item.disabled}
            aria-disabled={item.disabled ? 'true' : undefined}
            aria-label={
              item.disabled
                ? `${item.label} — disabled, voice input not implemented`
                : `Navigate to ${item.label}`
            }
            title={
              item.disabled
                ? 'Voice input — not implemented (Milestone 1)'
                : `Go to ${item.label}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
