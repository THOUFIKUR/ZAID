import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Ensure no real network requests are possible during tests
vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fetch: no network in tests'))))
vi.stubGlobal('XMLHttpRequest', vi.fn(() => { throw new Error('XMLHttpRequest: no network in tests') }))
vi.stubGlobal('WebSocket', vi.fn(() => { throw new Error('WebSocket: no network in tests') }))

// Ensure no mediaDevices access
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.reject(new Error('getUserMedia: not allowed in tests'))),
  },
  configurable: true,
})

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Suppress specific React warnings in tests
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const msg = String(args[0] ?? '')
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Warning: ReactDOM.render') ||
    msg.includes('act(')
  ) return
  originalConsoleError(...args)
}
