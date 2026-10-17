/**
 * useSystemMetrics — polls /api/system every 3 s.
 * Falls back to null (callers show demo data) if backend unreachable.
 */
import { useState, useEffect, useRef } from 'react'
import { getSystemMetrics, getChatStatus } from '../api/client'
import type { SystemMetrics } from '../api/client'

const POLL_MS = 3000

export interface SystemState {
  metrics: SystemMetrics | null
  ollamaConnected: boolean
  loading: boolean
  error: string | null
}

export function useSystemMetrics(): SystemState {
  const [state, setState] = useState<SystemState>({
    metrics: null, ollamaConnected: false, loading: true, error: null,
  })
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAll = async () => {
    try {
      const [metrics, chatStatus] = await Promise.all([
        getSystemMetrics(),
        getChatStatus().catch(() => ({ connected: false, model_present: false })),
      ])
      setState({
        metrics,
        ollamaConnected: chatStatus.connected && (chatStatus as { model_present: boolean }).model_present,
        loading: false,
        error: null,
      })
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Backend offline' }))
    }
  }

  useEffect(() => {
    fetchAll()
    timer.current = setInterval(fetchAll, POLL_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  return state
}
