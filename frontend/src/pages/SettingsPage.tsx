import { PlaceholderPage } from './PlaceholderPage'

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Configure ZAID: choose your AI model, set approved folder scopes, manage integrations, customise the dashboard, and control privacy and security settings."
      safetyNote="Settings changes take effect only after you confirm. No remote configuration. All settings stored locally in a configuration file. Factory reset available to restore defaults."
      plannedFeatures={[
        { label: 'AI model selection and Ollama endpoint' },
        { label: 'Approved folder scope configuration' },
        { label: 'Integration credentials management (local-only)' },
        { label: 'Dashboard layout customisation' },
        { label: 'Privacy controls (memory, logging)' },
        { label: 'Theme and accent colour selection' },
        { label: 'Keyboard shortcut configuration' },
        { label: 'Factory reset' },
      ]}
    />
  )
}
