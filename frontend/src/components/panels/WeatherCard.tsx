import { Panel } from '../common/Panel'
import { DemoBadge } from '../common/DemoBadge'
import { DEMO_WEATHER } from '../../data/demo'
import styles from './WeatherCard.module.css'

/**
 * WeatherCard — demo placeholder only.
 * No API call, no geolocation, no real weather data.
 */
export function WeatherCard() {
  return (
    <Panel aria-label="Weather card — demo data" badge={<DemoBadge />}>
      <div className={styles.card}>
        <div className={styles.location}>{DEMO_WEATHER.location}</div>
        <div className={styles.temp}>{DEMO_WEATHER.temperature}</div>
        <div className={styles.condition}>{DEMO_WEATHER.condition}</div>
        <div className={styles.details}>
          <span>💧 {DEMO_WEATHER.humidity}</span>
          <span>💨 {DEMO_WEATHER.wind}</span>
        </div>
        <p className={styles.note}>No weather API — demo values only</p>
      </div>
    </Panel>
  )
}
