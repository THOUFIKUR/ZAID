import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/layout/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppRoutes } from './AppRoutes'

/**
 * App — root component. Provides BrowserRouter, ErrorBoundary, and ToastProvider.
 * Routes are in AppRoutes so tests can use MemoryRouter without a double-Router conflict.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
