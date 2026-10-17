import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { EmptyState } from '../common/EmptyState'
import { DEMO_EVENTS, SHOW_DEMO_DATA } from '../../data/demo'
import styles from './UpcomingEventsPanel.module.css'

export function UpcomingEventsPanel() {
  return (
    <Panel
      title="Upcoming Events"
      aria-label="Upcoming Events panel — demo data"
      badge={<DemoBadge />}
    >
      {SHOW_DEMO_DATA ? (
        <ul className={styles.list} role="list">
          {DEMO_EVENTS.map(event => (
            <li key={event.id} className={styles.event}>
              <div className={styles.time}>{event.time}</div>
              <div className={styles.details}>
                <span className={styles.title}>{event.title}</span>
                <span className={styles.tag}>{event.tag}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="📅"
          title="No upcoming events"
          description="Connect calendar integration to see events."
        />
      )}
    </Panel>
  )
}
