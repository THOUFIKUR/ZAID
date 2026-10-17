import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { Sparkline } from '../hud/Sparkline'
import { DEMO_NETWORK, DEMO_NETWORK_SPARKLINE } from '../../data/demo'
import type { SystemMetrics } from '../../api/client'
import styles from './NetworkPanel.module.css'

interface Props { network: SystemMetrics['network'] | null }

export function NetworkPanel({ network }: Props) {
  const isReal = !!network

  const iface   = isReal ? (network!.iface ?? 'Unknown') : DEMO_NETWORK.ssid
  const ip      = isReal ? (network!.ip ?? '—')          : DEMO_NETWORK.ip
  const dl      = isReal ? network!.download              : DEMO_NETWORK.download
  const ul      = isReal ? network!.upload                : DEMO_NETWORK.upload

  return (
    <Panel
      title="Network"
      aria-label={`Network panel${isReal ? '' : ' — demo data'}`}
      badge={isReal ? undefined : <DemoBadge />}
    >
      <div className={styles.info}>
        <div className={styles.row}>
          <span className={styles.key}>IFACE</span>
          <span className={styles.val}>{iface}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>IP</span>
          <span className={styles.val}>{ip}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>↓ DOWN</span>
          <span className={styles.val} style={{ color: 'var(--cyan)' }}>{dl}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>↑ UP</span>
          <span className={styles.val} style={{ color: 'var(--amber)' }}>{ul}</span>
        </div>
      </div>

      <div className={styles.sparkWrapper}>
        <span className={styles.sparkLabel}>BANDWIDTH HISTORY</span>
        <Sparkline
          data={DEMO_NETWORK_SPARKLINE}
          width={200} height={32}
          color="var(--cyan)"
          label="Network bandwidth history"
        />
      </div>

      {!isReal && <p className={styles.note}>No real network detection. Backend offline.</p>}
    </Panel>
  )
}
