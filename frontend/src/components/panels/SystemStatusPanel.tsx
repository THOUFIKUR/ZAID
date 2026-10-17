import { useMemo } from 'react'
import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { RadialGauge } from '../hud/RadialGauge'
import { Sparkline } from '../hud/Sparkline'
import { DEMO_GAUGES, DEMO_SPARKLINE_DATA, DEMO_CPU_CLOCK, DEMO_RAM_USAGE, DEMO_CPU_TEMP, DEMO_GPU_USAGE } from '../../data/demo'
import type { SystemMetrics } from '../../api/client'
import styles from './SystemStatusPanel.module.css'

interface Props { metrics: SystemMetrics | null }

export function SystemStatusPanel({ metrics }: Props) {
  const isReal = !!metrics
  const cpu = metrics?.cpu
  const mem = metrics?.memory
  const gpu = metrics?.gpu

  const gauges = useMemo(() => isReal ? [
    { label: 'CPU',  value: Math.round(cpu?.percent ?? 0),   unit: '%',  color: 'var(--orange)' },
    { label: 'RAM',  value: Math.round(mem?.percent ?? 0),   unit: '%',  color: 'var(--red)' },
    { label: 'TEMP', value: Math.round(cpu?.temperature_c ?? 0), unit: '°C', color: 'var(--amber)' },
    { label: 'GPU',  value: gpu ? Math.round(gpu.utilization_pct) : 0, unit: '%', color: 'var(--red-deep)' },
  ] : DEMO_GAUGES, [isReal, cpu, mem, gpu])

  const cpuClock = isReal && cpu?.freq_ghz ? `${cpu.freq_ghz} GHz` : DEMO_CPU_CLOCK
  const ramUsage = isReal && mem ? `${mem.used_gb} / ${mem.total_gb} GB` : DEMO_RAM_USAGE
  const cpuTemp  = isReal && cpu?.temperature_c ? `${cpu.temperature_c}°C` : DEMO_CPU_TEMP
  const gpuUsage = isReal && gpu ? `${gpu.utilization_pct.toFixed(0)}%` : DEMO_GPU_USAGE

  return (
    <Panel
      title="System Status"
      aria-label={`System Status panel${isReal ? '' : ' — demo data'}`}
      badge={isReal
        ? <span className={styles.live} aria-label="Live data">● LIVE</span>
        : <DemoBadge caption="Not real system metrics" />}
    >
      {/* Gauges row */}
      <div className={styles.gauges} aria-label={`System gauges${isReal ? '' : ' (demo data)'}`}>
        {gauges.map(g => (
          <RadialGauge key={g.label} label={g.label} value={g.value}
            unit={g.unit} color={g.color} size={82} />
        ))}
      </div>

      {/* Sparkline */}
      <div className={styles.sparklineWrapper} aria-label="CPU history chart">
        <span className={styles.sparkLabel}>CPU HISTORY</span>
        <Sparkline data={DEMO_SPARKLINE_DATA} width={220} height={36}
          color="var(--orange)" label="CPU usage over time" />
      </div>

      {/* Stats grid */}
      <dl className={styles.stats}>
        <div className={styles.stat}><dt>CPU CLOCK</dt><dd>{cpuClock}</dd></div>
        <div className={styles.stat}><dt>RAM</dt><dd>{ramUsage}</dd></div>
        <div className={styles.stat}><dt>CPU TEMP</dt><dd>{cpuTemp}</dd></div>
        <div className={styles.stat}><dt>GPU</dt><dd>{gpuUsage}</dd></div>
      </dl>
    </Panel>
  )
}
