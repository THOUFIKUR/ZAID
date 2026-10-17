import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { EmptyState } from '../common/EmptyState'
import { ProgressBar } from '../hud/ProgressBar'
import { DEMO_TASKS, SHOW_DEMO_DATA } from '../../data/demo'
import styles from './ActiveTasksPanel.module.css'

export function ActiveTasksPanel() {
  return (
    <Panel
      title="Active Tasks"
      aria-label="Active Tasks panel — demo data"
      badge={<DemoBadge caption="DEMO — none running" />}
    >
      {SHOW_DEMO_DATA ? (
        <ul className={styles.list} role="list">
          {DEMO_TASKS.map(task => (
            <li key={task.id} className={styles.taskItem}>
              <div className={styles.taskHeader}>
                <span className={styles.taskLabel}>{task.label}</span>
                <span className={styles.taskTag}>SAMPLE</span>
              </div>
              <ProgressBar
                label=""
                value={task.progress}
                color="var(--amber)"
                showValue={true}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="⚡"
          title="No tasks"
          description="Active tasks appear here when AI engine is connected."
        />
      )}
    </Panel>
  )
}
