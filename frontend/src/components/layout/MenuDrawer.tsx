import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './MenuDrawer.module.css'

interface NavEntry {
  label: string
  path: string
}

// 13 navigation entries in specified order
const NAV_ITEMS: NavEntry[] = [
  { label: 'Overview',     path: '/'             },
  { label: 'Chat',         path: '/chat'          },
  { label: 'Computer',     path: '/computer'      },
  { label: 'Files',        path: '/files'         },
  { label: 'Browser',      path: '/browser'       },
  { label: 'Phone',        path: '/phone'         },
  { label: 'Messages',     path: '/messages'      },
  { label: 'Calendar',     path: '/calendar'      },
  { label: 'Integrations', path: '/integrations'  },
  { label: 'Automation',   path: '/automation'    },
  { label: 'Memory',       path: '/memory'        },
  { label: 'Activity',     path: '/activity'      },
  { label: 'Settings',     path: '/settings'      },
]

interface MenuDrawerProps {
  open: boolean
  currentPath: string
  onClose: () => void
  triggerId: string
}

export function MenuDrawer({ open, currentPath, onClose, triggerId }: MenuDrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef  = useRef<HTMLButtonElement>(null)
  const location  = useLocation()

  // Focus trap + close on Escape
  useEffect(() => {
    if (!open) return

    // Move focus to close button on open
    closeRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Restore focus to trigger on close
  useEffect(() => {
    if (!open) {
      const trigger = document.getElementById(triggerId) as HTMLElement | null
      trigger?.focus()
    }
  }, [open, triggerId])

  // Close when navigation happens
  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer dialog */}
      <div
        id="menu-drawer"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={styles.drawer}
      >
        <header className={styles.header}>
          <span className={styles.drawerTitle}>NAVIGATION</span>
          <button
            ref={closeRef}
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </header>

        <nav aria-label="Main navigation">
          <ul className={styles.list} role="list">
            {NAV_ITEMS.map(item => {
              const isCurrent = item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path)
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`${styles.link} ${isCurrent ? styles.active : ''}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={onClose}
                  >
                    {item.label}
                    {isCurrent && (
                      <span className={styles.indicator} aria-hidden="true" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <footer className={styles.footer}>
          <span className={styles.version}>ZAID — Milestone 1 — UI Preview</span>
        </footer>
      </div>
    </>
  )
}

export { NAV_ITEMS }
