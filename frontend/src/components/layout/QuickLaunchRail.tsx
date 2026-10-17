import { useNavigate } from 'react-router-dom'
import { useToast } from './Toast'
import styles from './QuickLaunchRail.module.css'

interface LaunchItem {
  id: string
  label: string
  path?: string
  icon: React.ReactNode
}

const LAUNCH_ITEMS: LaunchItem[] = [
  { id: 'computer', label: 'Computer', path: '/computer',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="3" width="16" height="11" rx="1.5"/><path d="M6 17h8M10 14v3"/></svg> },
  { id: 'browser',  label: 'Browser',  path: '/browser',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a12 12 0 0 1 0 16M10 2a12 12 0 0 0 0 16"/></svg> },
  { id: 'files',    label: 'Files',    path: '/files',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2-2h3.5L10 5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"/></svg> },
  { id: 'code',     label: 'Code',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polyline points="6,8 2,12 6,16"/><polyline points="14,8 18,12 14,16"/><line x1="11" y1="5" x2="9" y2="19"/></svg> },
  { id: 'notes',    label: 'Notes',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="2" width="14" height="16" rx="1.5"/><line x1="6" y1="7" x2="14" y2="7"/><line x1="6" y1="11" x2="14" y2="11"/><line x1="6" y1="15" x2="10" y2="15"/></svg> },
  { id: 'calendar', label: 'Calendar', path: '/calendar',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="4" width="16" height="14" rx="1.5"/><line x1="2" y1="8" x2="18" y2="8"/><line x1="6" y1="2" x2="6" y2="6"/><line x1="14" y1="2" x2="14" y2="6"/></svg> },
  { id: 'whatsapp', label: 'WhatsApp', path: '/messages',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 2a8 8 0 0 1 6.93 12L18 18l-4.13-1.05A8 8 0 1 1 10 2z"/><path d="M7.5 8.5c.5 2 3.5 4.5 5 3"/></svg> },
  { id: 'telegram', label: 'Telegram', path: '/messages',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M18 3L2 9.5l5.5 2L15 7l-4.5 6 2 4.5L18 3z"/></svg> },
  { id: 'email',    label: 'Email',    path: '/messages',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="4" width="16" height="12" rx="1.5"/><polyline points="2,5 10,11 18,5"/></svg> },
  { id: 'photos',   label: 'Photos',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="3" width="16" height="14" rx="1.5"/><circle cx="7" cy="8" r="1.5"/><path d="M2 14l4-4 3 3 3-3 6 6"/></svg> },
  { id: 'music',    label: 'Music',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="6" cy="15" r="2"/><circle cx="14" cy="13" r="2"/><path d="M8 15V6l8-2v9"/></svg> },
  { id: 'settings', label: 'Settings', path: '/settings',
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/></svg> },
]

export function QuickLaunchRail() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const handleLaunch = (item: LaunchItem) => {
    if (item.path) {
      navigate(item.path)
    } else {
      showToast(`${item.label} launcher is not implemented yet.`, 'info')
    }
  }

  return (
    <nav className={styles.rail} aria-label="Quick Launch">
      <div className={styles.header} aria-hidden="true">
        <span>QUICK</span>
        <span>LAUNCH</span>
      </div>
      <ul className={styles.list} role="list">
        {LAUNCH_ITEMS.map(item => (
          <li key={item.id}>
            <button
              className={styles.item}
              onClick={() => handleLaunch(item)}
              aria-label={item.path
                ? `Open ${item.label}`
                : `${item.label} — not implemented`}
              title={item.path ? `Go to ${item.label}` : `${item.label} — not implemented yet`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
