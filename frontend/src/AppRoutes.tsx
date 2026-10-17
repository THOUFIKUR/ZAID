import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'

// Pages
import OverviewPage     from './pages/OverviewPage'
import ChatPage         from './pages/ChatPage'
import ComputerPage     from './pages/ComputerPage'
import FilesPage        from './pages/FilesPage'
import BrowserPage      from './pages/BrowserPage'
import PhonePage        from './pages/PhonePage'
import MessagesPage     from './pages/MessagesPage'
import CalendarPage     from './pages/CalendarPage'
import IntegrationsPage from './pages/IntegrationsPage'
import AutomationPage   from './pages/AutomationPage'
import MemoryPage       from './pages/MemoryPage'
import ActivityPage     from './pages/ActivityPage'
import SettingsPage     from './pages/SettingsPage'
import NotFoundPage     from './pages/NotFoundPage'

/**
 * AppRoutes contains all routes but NO Router provider.
 * Used directly by App (inside BrowserRouter) and by tests (inside MemoryRouter).
 */
export function AppRoutes() {
  // Pause decorative animations when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      document.documentElement.dataset.animationsPaused = document.hidden ? 'true' : 'false'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <Routes>
      <Route path="/"              element={<OverviewPage />} />
      <Route path="/chat"          element={<ChatPage />} />
      <Route path="/computer"      element={<ComputerPage />} />
      <Route path="/files"         element={<FilesPage />} />
      <Route path="/browser"       element={<BrowserPage />} />
      <Route path="/phone"         element={<PhonePage />} />
      <Route path="/messages"      element={<MessagesPage />} />
      <Route path="/calendar"      element={<CalendarPage />} />
      <Route path="/integrations"  element={<IntegrationsPage />} />
      <Route path="/automation"    element={<AutomationPage />} />
      <Route path="/memory"        element={<MemoryPage />} />
      <Route path="/activity"      element={<ActivityPage />} />
      <Route path="/settings"      element={<SettingsPage />} />
      <Route path="*"              element={<NotFoundPage />} />
    </Routes>
  )
}
