import { PlaceholderPage } from './PlaceholderPage'

export default function MessagesPage() {
  return (
    <PlaceholderPage
      title="Messages"
      description="This page will unify your messaging apps — WhatsApp, Telegram, Email, and SMS — into a single view, allowing ZAID to help draft, summarise, and manage your conversations under your control."
      safetyNote="Read-only access first. No autonomous message sending. Every outgoing message requires your review and send confirmation. No message content is stored on external servers."
      plannedFeatures={[
        { label: 'Unified inbox view (WhatsApp, Telegram, Email, SMS)' },
        { label: 'AI-assisted reply drafting (you approve before sending)' },
        { label: 'Conversation summarisation' },
        { label: 'Smart prioritisation and filtering' },
        { label: 'Local-only storage — no cloud sync' },
      ]}
    />
  )
}
