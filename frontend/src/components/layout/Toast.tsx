import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ToastItem } from '../../types'
import styles from './Toast.module.css'

interface ToastContextValue {
  showToast: (message: string, variant?: ToastItem['variant']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let _nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, variant: ToastItem['variant'] = 'info') => {
    const id = String(_nextId++)
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast region — aria-live for screen readers */}
      <div
        className={styles.region}
        aria-live="polite"
        aria-atomic="false"
        aria-label="Notifications"
        role="region"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={styles.toast}
            data-variant={toast.variant}
            role="status"
          >
            <span className={styles.message}>{toast.message}</span>
            <button
              className={styles.dismiss}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
