import { Component, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.wrapper} role="alert" aria-live="assertive">
          <div className={styles.orb} aria-hidden="true">
            <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
              <circle cx="40" cy="40" r="36" stroke="var(--red)" strokeWidth="2" fill="none" />
              <circle cx="40" cy="40" r="20" stroke="var(--orange)" strokeWidth="1.5" fill="none" />
              <text x="40" y="46" textAnchor="middle" fill="var(--red)" fontSize="22" fontFamily="var(--font-display)">!</text>
            </svg>
          </div>
          <h1 className={styles.title}>Something Went Wrong</h1>
          <p className={styles.message}>
            ZAID encountered an unexpected error. No data has been sent anywhere.
          </p>
          {this.state.error && (
            <pre className={styles.detail}>{this.state.error.message}</pre>
          )}
          <button className={styles.btn} onClick={this.handleReload}>
            Reload ZAID
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
