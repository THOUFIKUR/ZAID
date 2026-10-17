import { PlaceholderPage } from './PlaceholderPage'

export default function PhonePage() {
  return (
    <PlaceholderPage
      title="Phone"
      description="This page will allow ZAID to manage phone-related tasks: call logs, SMS, and contacts — integrating with your phone via a paired companion app. No calls or messages are made without your explicit instruction."
      safetyNote="No autonomous calls or SMS. Every outgoing action requires explicit confirmation. No access to contacts without permission. Companion app pairing required — no third-party service accounts used."
      plannedFeatures={[
        { label: 'View recent call log (read-only)' },
        { label: 'Initiate calls with confirmation' },
        { label: 'Read and compose SMS with confirmation' },
        { label: 'Contact search and AI-assisted drafting' },
        { label: 'Companion Android/iOS app pairing' },
      ]}
    />
  )
}
