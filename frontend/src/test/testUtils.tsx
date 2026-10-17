// Helper to wrap components in all required providers for tests
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../components/layout/Toast'
import type { ReactNode } from 'react'

export function renderWrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ToastProvider>
        {children}
      </ToastProvider>
    </BrowserRouter>
  )
}
