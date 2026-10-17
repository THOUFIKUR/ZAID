import { AppShell } from '../components/layout/AppShell'
import { StatusBadge } from '../components/common/StatusBadge'
import styles from './PlaceholderPage.module.css'

interface PlannedFeature {
  label: string
  note?: string
}

interface PlaceholderPageProps {
  title: string
  description: string
  safetyNote: string
  plannedFeatures: PlannedFeature[]
}

export function PlaceholderPage({ title, description, safetyNote, plannedFeatures }: PlaceholderPageProps) {
  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <StatusBadge variant="unimplemented" />
        </header>

        <p className={styles.description}>{description}</p>

        <section className={styles.section} aria-label="Safety model">
          <h2 className={styles.sectionTitle}>Safety Model</h2>
          <p className={styles.safetyNote}>{safetyNote}</p>
        </section>

        <section className={styles.section} aria-label="Planned features">
          <h2 className={styles.sectionTitle}>Planned Features (Not Working)</h2>
          <ul className={styles.featureList} role="list">
            {plannedFeatures.map((f, i) => (
              <li key={i} className={styles.feature}>
                <span className={styles.featureIcon} aria-hidden="true">◇</span>
                <span className={styles.featureLabel}>{f.label}</span>
                {f.note && <span className={styles.featureNote}>{f.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.milestone}>
          <StatusBadge variant="unimplemented" label="PLANNED FOR A LATER MILESTONE" />
        </div>
      </div>
    </AppShell>
  )
}
