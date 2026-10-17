import { PlaceholderPage } from './PlaceholderPage'

export default function AutomationPage() {
  return (
    <PlaceholderPage
      title="Automation"
      description="This page will allow you to create, manage, and run automation workflows — sequences of approved actions triggered by conditions, schedules, or voice commands."
      safetyNote="All automations require explicit user creation and activation. No automation runs without your approval. Automations are sandboxed and cannot access resources outside their defined scope."
      plannedFeatures={[
        { label: 'Visual workflow builder' },
        { label: 'Conditional triggers (time, event, voice)' },
        { label: 'Approved action library' },
        { label: 'Automation history and audit log' },
        { label: 'Enable/disable individual automations' },
        { label: 'Import/export automation recipes' },
      ]}
    />
  )
}
