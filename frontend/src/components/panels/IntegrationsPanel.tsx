import { Panel } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'
import { useToast } from '../layout/Toast'
import { INTEGRATIONS } from '../../data/demo'
import styles from './IntegrationsPanel.module.css'

export function IntegrationsPanel() {
  const { showToast } = useToast()

  const handleClick = (label: string) => {
    showToast(`${label} integration is not implemented yet.`, 'info')
  }

  return (
    <nav className={styles.rail} aria-label="Integrations">
      <div className={styles.header}>
        <span>INTEGRATIONS</span>
      </div>
      <p className={styles.caption}>All integrations: Unimplemented</p>
      <ul className={styles.list} role="list">
        {INTEGRATIONS.map(item => (
          <li key={item.id}>
            <button
              className={styles.item}
              onClick={() => handleClick(item.label)}
              aria-label={`${item.label} — unimplemented`}
              title={`${item.label} — not implemented`}
            >
              <span className={styles.indicator} aria-hidden="true" />
              <span className={styles.label}>{item.label}</span>
              <StatusBadge variant="unimplemented" label="–" />
            </button>
          </li>
        ))}
      </ul>
      <Panel aria-label="Integration panel footer" className={styles.footerPanel}>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', fontStyle: 'italic', textAlign: 'center' }}>
          Clicking shows a toast. Nothing connects.
        </p>
      </Panel>
    </nav>
  )
}
