import { Panel } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'
import { MODEL_NAME } from '../../data/demo'
import type { SystemMetrics } from '../../api/client'
import styles from './LocalModelPanel.module.css'

interface Props {
  ollamaConnected: boolean
  metrics: SystemMetrics | null
}

export function LocalModelPanel({ ollamaConnected, metrics }: Props) {
  const gpu = metrics?.gpu
  const gpuVram  = gpu ? `${gpu.memory_used_mb.toFixed(0)} / ${gpu.memory_total_mb.toFixed(0)} MB` : '--'
  const gpuUtil  = gpu ? `${gpu.utilization_pct.toFixed(0)}%` : '--'
  const gpuTemp  = gpu ? `${gpu.temperature_c}°C` : '--'

  return (
    <Panel title="Local AI Model" aria-label="Local AI Model panel">
      <div className={styles.modelHeader}>
        <span className={styles.modelName} aria-label={`Model: ${MODEL_NAME}`}>{MODEL_NAME}</span>
        {ollamaConnected
          ? <StatusBadge variant="connected" label="ONLINE" />
          : <StatusBadge variant="disconnected" label="NOT CONNECTED" />}
      </div>

      {ollamaConnected
        ? <p className={styles.note}>Model loaded · Streaming ready</p>
        : <p className={styles.note}>Configured target (not verified) — start backend to connect</p>}

      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>GPU VRAM</dt>
          <dd aria-label={`GPU VRAM: ${gpuVram}`}>{gpuVram}</dd>
        </div>
        <div className={styles.metric}>
          <dt>GPU UTIL</dt>
          <dd aria-label={`GPU utilisation: ${gpuUtil}`}>{gpuUtil}</dd>
        </div>
        <div className={styles.metric}>
          <dt>GPU TEMP</dt>
          <dd aria-label={`GPU temperature: ${gpuTemp}`}>{gpuTemp}</dd>
        </div>
        <div className={styles.metric}>
          <dt>CONTEXT</dt>
          <dd aria-label="Context window">32k</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <a href="/chat" className={styles.actionLink}>Open Chat →</a>
      </div>
    </Panel>
  )
}
