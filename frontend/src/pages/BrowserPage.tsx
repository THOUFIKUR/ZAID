import { PlaceholderPage } from './PlaceholderPage'

export default function BrowserPage() {
  return (
    <PlaceholderPage
      title="Browser"
      description="This page will allow ZAID to assist with web browsing tasks: opening pages, reading content, filling forms, and performing research — all under your supervision and within allowed domains."
      safetyNote="No autonomous browsing. User approves each navigation. No credential auto-fill. No access to banking or sensitive sites unless explicitly allowlisted. All browsing is local — no data sent to external servers."
      plannedFeatures={[
        { label: 'Open URLs (with user approval)' },
        { label: 'Read page content for AI summarisation' },
        { label: 'Web search and result summarisation' },
        { label: 'Form assistance (no password auto-fill)' },
        { label: 'Bookmark management' },
        { label: 'Domain allowlist in Settings' },
      ]}
    />
  )
}
