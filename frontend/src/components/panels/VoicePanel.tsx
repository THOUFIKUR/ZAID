import { Panel } from '../common/Panel'
import { StatusBadge } from '../common/StatusBadge'
import { WaveformStatic } from '../hud/WaveformStatic'
import styles from './VoicePanel.module.css'

/**
 * VoicePanel — NOT IMPLEMENTED.
 * Static waveform only. No microphone access ever.
 * Mic button is disabled with aria-disabled="true".
 */
export function VoicePanel() {
  return (
    <Panel title="Voice Input" aria-label="Voice Input panel — not implemented">
      <div className={styles.header}>
        <StatusBadge variant="unimplemented" label="NOT IMPLEMENTED" />
        <span className={styles.micOff} aria-label="Microphone: off">Mic: off</span>
      </div>

      <div className={styles.waveform} aria-hidden="true">
        <WaveformStatic width={200} height={36} color="var(--orange)" />
      </div>

      <div className={styles.controls}>
        <button
          className={styles.micBtn}
          disabled
          aria-disabled="true"
          aria-label="Microphone button — disabled, voice input not implemented"
          title="Voice input not implemented in Milestone 1"
          type="button"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="9" y="2" width="6" height="13" rx="3"/>
            <path d="M5 10 Q5 18 12 18 Q19 18 19 10"/>
            <line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
            <line x1="3" y1="3" x2="21" y2="21" stroke="var(--red)" strokeWidth="2"/>
          </svg>
          <span>Voice Off</span>
        </button>

        <input
          type="text"
          className={styles.textInput}
          placeholder="Voice and commands arrive in a later milestone"
          disabled
          aria-disabled="true"
          aria-label="Command input — disabled, not implemented"
          readOnly
        />
      </div>

      <p className={styles.note}>
        Voice input arrives in a later milestone. No microphone permission is requested.
      </p>
    </Panel>
  )
}
