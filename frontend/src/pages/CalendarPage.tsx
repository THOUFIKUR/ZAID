import { PlaceholderPage } from './PlaceholderPage'

export default function CalendarPage() {
  return (
    <PlaceholderPage
      title="Calendar"
      description="This page will show your schedule, allow ZAID to help plan your day, create events with your approval, and provide smart reminders — all sourced from your local or synced calendar data."
      safetyNote="Read-only calendar access first. Event creation and deletion require explicit confirmation. No calendar data is sent to external services. Local calendar files only unless you opt into sync."
      plannedFeatures={[
        { label: 'View today\'s and upcoming events' },
        { label: 'Create events with confirmation dialog' },
        { label: 'AI-powered scheduling suggestions' },
        { label: 'Local .ics file support' },
        { label: 'Optional Google Calendar / Outlook sync (opt-in)' },
        { label: 'Smart reminders and conflict detection' },
      ]}
    />
  )
}
