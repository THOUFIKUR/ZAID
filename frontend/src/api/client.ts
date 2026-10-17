/**
 * ZAID API client — all calls go through /api/* (proxied by Vite to 127.0.0.1:8000)
 * Never calls any external URL. All requests are loopback only.
 */

const BASE = '/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { detail = (await res.json()).detail ?? detail } catch { /* empty */ }
    throw new ApiError(res.status, detail)
  }
  return res.json() as T
}

// ── Health ────────────────────────────────────────────────────────────────────
export function getHealth() {
  return request<{ status: string; version: string; model: string }>('/health')
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export function getChatStatus() {
  return request<{
    connected: boolean
    model: string
    model_present: boolean
    error?: string
  }>('/chat/status')
}

/**
 * Stream a chat response from Ollama via SSE.
 * Calls onToken for each streamed token, onDone when complete.
 * Returns an AbortController so the caller can cancel.
 */
export function streamChat(
  messages: { role: string; content: string }[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  model?: string,
): AbortController {
  const ac = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: model ?? undefined }),
        signal: ac.signal,
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        onError(j.detail ?? `Server error ${res.status}`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { onError('No response body'); return }

      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const raw = line.slice(5).trim()
          if (!raw) continue
          try {
            const d = JSON.parse(raw) as { token?: string; done?: boolean; error?: string }
            if (d.error) { onError(d.error); return }
            if (d.token) onToken(d.token)
            if (d.done) { onDone(); return }
          } catch { /* malformed SSE */ }
        }
      }
      onDone()
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        onError((e as Error).message ?? 'Stream error')
      }
    }
  })()

  return ac
}

// ── System metrics ────────────────────────────────────────────────────────────
export interface SystemMetrics {
  cpu: { percent: number; freq_ghz: number | null; freq_max_ghz: number | null; cores_logical: number; temperature_c: number | null }
  memory: { total_gb: number; used_gb: number; percent: number }
  disk: { device: string; mountpoint: string; total_gb: number; used_gb: number; percent: number }[]
  network: { iface: string | null; ip: string | null; download: string; upload: string }
  battery: { percent: number; plugged: boolean } | null
  gpu: { name: string; utilization_pct: number; memory_used_mb: number; memory_total_mb: number; temperature_c: number } | null
}

export function getSystemMetrics() {
  return request<SystemMetrics>('/system')
}

// ── Files ─────────────────────────────────────────────────────────────────────
export interface FileEntry {
  name: string; path: string; is_dir: boolean; size_bytes: number | null
  modified: number | null; extension: string | null; readable: boolean
}

export function getFileRoots() {
  return request<{ roots: { path: string; name: string }[] }>('/files/roots')
}

export function listDirectory(path: string) {
  return request<{ path: string; entries: FileEntry[] }>(`/files/ls?path=${encodeURIComponent(path)}`)
}

export function readFile(path: string) {
  return request<{ path: string; name: string; content: string; mime: string }>(`/files/read?path=${encodeURIComponent(path)}`)
}

// ── Desktop ───────────────────────────────────────────────────────────────────
export function getApprovedApps() {
  return request<{ apps: { id: string; label: string; available: boolean }[] }>('/desktop/apps')
}

export function launchApp(app_id: string) {
  return request<{ launched: boolean; app_id: string; pid: number }>('/desktop/launch', {
    method: 'POST',
    body: JSON.stringify({ app_id }),
  })
}

export function getProcesses() {
  return request<{ processes: { pid: number; name: string; cpu_pct: number; mem_pct: number }[] }>('/desktop/processes')
}

// ── Memory ────────────────────────────────────────────────────────────────────
export interface MemoryEntry {
  id: string; content: string; category: string; tags: string[]; created_at: number; updated_at: number
}

export function getMemories(category?: string) {
  const q = category ? `?category=${category}` : ''
  return request<{ memories: MemoryEntry[]; total: number }>(`/memory${q}`)
}

export function addMemory(content: string, category = 'general', tags: string[] = []) {
  return request<MemoryEntry>('/memory', {
    method: 'POST',
    body: JSON.stringify({ content, category, tags }),
  })
}

export function deleteMemory(id: string) {
  return fetch(`${BASE}/memory/${id}`, { method: 'DELETE' })
}

export function clearMemories() {
  return fetch(`${BASE}/memory`, { method: 'DELETE' })
}

// ── Activity ──────────────────────────────────────────────────────────────────
export interface ActivityEntry {
  id: string; category: string; description: string; meta: Record<string, unknown>; timestamp: number
}

export function getActivity(limit = 50, category?: string) {
  const q = new URLSearchParams({ limit: String(limit) })
  if (category) q.set('category', category)
  return request<{ entries: ActivityEntry[]; total: number }>(`/activity?${q}`)
}

export function clearActivity() {
  return fetch(`${BASE}/activity`, { method: 'DELETE' })
}

// ── Integrations & MCP ────────────────────────────────────────────────────────
export interface CatalogItem {
  id: string
  name: string
  category: 'productivity' | 'email_calendar' | 'files_storage' | 'developer_tools' | 'messaging' | 'browser_web' | 'local_tools' | 'custom_mcp'
  type: 'native' | 'official_api' | 'oauth_connection' | 'mcp_server' | 'local_tool' | 'coming_soon'
  status: 'connected' | 'disconnected' | 'available' | 'needs_setup' | 'coming_soon'
  description: string
  capabilities: string[]
  icon: string
  setup_guide: string
  permissions_needed: string[]
  doc_url?: string
  default_config?: Record<string, unknown>
  account_identity?: string
  tool_count?: number
  last_sync?: number
}

export interface StoredTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
  enabled: boolean
}

export interface ConnectedIntegration {
  id: string
  name: string
  category: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  account_identity?: string
  last_sync: number
  connected_at: number
  last_error?: string
  tools: StoredTool[]
  config: Record<string, unknown>
}

export interface McpTestResult {
  success: boolean
  server_name?: string
  server_version?: string
  tools: {
    name: string
    description?: string
    input_schema: Record<string, unknown>
    enabled: boolean
  }[]
  error?: string
  latency_ms?: number
}

export function getIntegrationsCatalog() {
  return request<{ catalog: CatalogItem[] }>('/integrations/catalog')
}

export function getConnectedIntegrations() {
  return request<{ integrations: ConnectedIntegration[]; total: number }>('/integrations/connected')
}

export function testMcpServer(params: {
  name: string
  transport: 'stdio' | 'sse'
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  url?: string
  headers?: Record<string, string>
  timeout_seconds?: number
}) {
  return request<McpTestResult>('/integrations/mcp/test', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function saveMcpServer(params: {
  id: string
  name: string
  category?: string
  transport: 'stdio' | 'sse'
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  url?: string
  headers?: Record<string, string>
  timeout_seconds?: number
  tools?: { name: string; enabled: boolean }[]
}) {
  return request<{ success: boolean; integration: ConnectedIntegration }>('/integrations/mcp/save', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function testApiService(params: { service_id: string; token: string }) {
  return request<{ success: boolean; account_identity?: string; error?: string }>('/integrations/api/test', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function saveApiService(params: { service_id: string; token: string }) {
  return request<{ success: boolean; integration: ConnectedIntegration }>('/integrations/api/save', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function testExistingIntegration(integrationId: string) {
  return request<{ success: boolean; latency_ms?: number; tools_count?: number; error?: string }>(
    `/integrations/${integrationId}/test`,
    { method: 'POST' }
  )
}

export function disconnectIntegration(integrationId: string) {
  return request<{ success: boolean; disconnected_id: string }>(`/integrations/${integrationId}`, {
    method: 'DELETE',
  })
}

export function toggleIntegrationTool(integrationId: string, toolName: string, enabled: boolean) {
  return request<{ success: boolean; enabled: boolean }>(
    `/integrations/${integrationId}/tools/${encodeURIComponent(toolName)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }
  )
}

export function executeToolAction(params: {
  integration_id: string
  tool_name: string
  arguments?: Record<string, unknown>
}) {
  return request<Record<string, unknown>>('/integrations/tools/execute', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

