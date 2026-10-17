import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { useToast } from '../components/layout/Toast'
import {
  getIntegrationsCatalog,
  getConnectedIntegrations,
  testMcpServer,
  saveMcpServer,
  testApiService,
  saveApiService,
  testExistingIntegration,
  disconnectIntegration,
  toggleIntegrationTool,
  type CatalogItem,
  type ConnectedIntegration,
  type McpTestResult,
} from '../api/client'
import styles from './IntegrationsPage.module.css'

type TabType = 'connected' | 'discover' | 'custom_mcp'
type CategoryFilter = 'all' | 'local_tools' | 'developer_tools' | 'browser_web' | 'productivity' | 'messaging' | 'email_calendar' | 'files_storage'

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All Categories',
  local_tools: 'Local Computer Tools',
  developer_tools: 'Developer Tools',
  browser_web: 'Browser & Web Research',
  productivity: 'Productivity & Notes',
  messaging: 'Messaging',
  email_calendar: 'Email & Calendar',
  files_storage: 'Files & Storage',
}

export default function IntegrationsPage() {
  const { showToast } = useToast()

  // ── State ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('connected')
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [connected, setConnected] = useState<ConnectedIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')

  // Testing states
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency_ms?: number; error?: string }>>({})

  // Guided Modal state
  const [modalService, setModalService] = useState<CatalogItem | null>(null)
  const [modalToken, setModalToken] = useState('')
  const [modalShowSecret, setModalShowSecret] = useState(false)
  const [modalTesting, setModalTesting] = useState(false)
  const [modalTestRes, setModalTestRes] = useState<{ success: boolean; account_identity?: string; error?: string } | null>(null)
  const [modalSaving, setModalSaving] = useState(false)

  // Custom MCP Wizard state
  const [mcpName, setMcpName] = useState('Custom MCP Server')
  const [mcpTransport, setMcpTransport] = useState<'stdio' | 'sse'>('stdio')
  const [mcpCommand, setMcpCommand] = useState('python')
  const [mcpArgs, setMcpArgs] = useState('D:/ZAID/backend/integrations/local_mcp_server.py')
  const [mcpCwd, setMcpCwd] = useState('')
  const [mcpUrl, setMcpUrl] = useState('')
  const [mcpHeaders, setMcpHeaders] = useState('')
  const [mcpTesting, setMcpTesting] = useState(false)
  const [mcpTestResult, setMcpTestResult] = useState<McpTestResult | null>(null)
  const [mcpToolToggles, setMcpToolToggles] = useState<Record<string, boolean>>({})
  const [mcpSaving, setMcpSaving] = useState(false)

  // ── Data Fetching ───────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      const [catRes, connRes] = await Promise.all([
        getIntegrationsCatalog().catch(() => ({ catalog: [] })),
        getConnectedIntegrations().catch(() => ({ integrations: [], total: 0 })),
      ])
      setCatalog(catRes.catalog)
      setConnected(connRes.integrations)
    } catch {
      showToast('Failed to load integrations status.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Total active tools count
  const totalActiveTools = useMemo(() => {
    return connected.reduce((acc, item) => {
      return acc + (item.tools ? item.tools.filter(t => t.enabled).length : 0)
    }, 0)
  }, [connected])

  // ── Connected Actions ───────────────────────────────────────────────────────
  const handleTestExisting = async (id: string, name: string) => {
    setTestingId(id)
    try {
      const res = await testExistingIntegration(id)
      setTestResults(prev => ({
        ...prev,
        [id]: {
          success: res.success,
          latency_ms: res.latency_ms,
          error: res.error,
        },
      }))
      if (res.success) {
        showToast(`${name} is verified and responsive (${res.latency_ms ?? 0}ms).`, 'info')
      } else {
        showToast(`${name} test failed: ${res.error ?? 'Unknown error'}`, 'error')
      }
      refreshData()
    } catch (err) {
      showToast(`Connection test failed: ${(err as Error).message}`, 'error')
    } finally {
      setTestingId(null)
    }
  }

  const handleDisconnect = async (id: string, name: string) => {
    if (!window.confirm(`Disconnect ${name}? This will revoke access and remove its tools from ZAID.`)) {
      return
    }
    try {
      await disconnectIntegration(id)
      showToast(`Disconnected ${name}.`, 'info')
      refreshData()
    } catch (err) {
      showToast(`Failed to disconnect: ${(err as Error).message}`, 'error')
    }
  }

  const handleToggleTool = async (integrationId: string, toolName: string, currentEnabled: boolean) => {
    try {
      await toggleIntegrationTool(integrationId, toolName, !currentEnabled)
      setConnected(prev =>
        prev.map(item => {
          if (item.id === integrationId) {
            return {
              ...item,
              tools: item.tools.map(t => (t.name === toolName ? { ...t, enabled: !currentEnabled } : t)),
            }
          }
          return item
        })
      )
      showToast(`Tool '${toolName}' ${!currentEnabled ? 'enabled' : 'disabled'}.`, 'info')
    } catch (err) {
      showToast(`Failed to toggle tool: ${(err as Error).message}`, 'error')
    }
  }

  // ── Catalog Filter ──────────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    const connectedIds = new Set(connected.map(c => c.id))
    return catalog.filter(item => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory

      return matchesSearch && matchesCat
    }).map(item => ({
      ...item,
      is_connected: connectedIds.has(item.id),
    }))
  }, [catalog, connected, searchQuery, selectedCategory])

  // ── Guided Modal Actions ───────────────────────────────────────────────────
  const openGuidedModal = (item: CatalogItem) => {
    setModalService(item)
    setModalToken('')
    setModalShowSecret(false)
    setModalTestRes(null)
  }

  const handleModalTest = async () => {
    if (!modalService || !modalToken.trim()) {
      showToast('Please enter required credentials or token.', 'warn')
      return
    }
    setModalTesting(true)
    setModalTestRes(null)
    try {
      const res = await testApiService({
        service_id: modalService.id,
        token: modalToken.trim(),
      })
      setModalTestRes(res)
      if (res.success) {
        showToast(`Verification successful for ${res.account_identity}!`, 'info')
      } else {
        showToast(res.error || 'Verification failed.', 'error')
      }
    } catch (err) {
      setModalTestRes({ success: false, error: (err as Error).message })
      showToast(`Error: ${(err as Error).message}`, 'error')
    } finally {
      setModalTesting(false)
    }
  }

  const handleModalSave = async () => {
    if (!modalService || !modalToken.trim()) return
    setModalSaving(true)
    try {
      await saveApiService({
        service_id: modalService.id,
        token: modalToken.trim(),
      })
      showToast(`Successfully connected ${modalService.name}!`, 'info')
      setModalService(null)
      refreshData()
      setActiveTab('connected')
    } catch (err) {
      showToast(`Save failed: ${(err as Error).message}`, 'error')
    } finally {
      setModalSaving(false)
    }
  }

  // ── Custom MCP Wizard Actions ──────────────────────────────────────────────
  const applyMcpPreset = (preset: 'local' | 'filesystem' | 'sse') => {
    if (preset === 'local') {
      setMcpName('ZAID Local Tools MCP')
      setMcpTransport('stdio')
      setMcpCommand('python')
      setMcpArgs('D:/ZAID/backend/integrations/local_mcp_server.py')
      setMcpUrl('')
      setMcpHeaders('')
    } else if (preset === 'filesystem') {
      setMcpName('Filesystem MCP Server')
      setMcpTransport('stdio')
      setMcpCommand('npx')
      setMcpArgs('-y @modelcontextprotocol/server-filesystem D:/ZAID')
      setMcpUrl('')
      setMcpHeaders('')
    } else if (preset === 'sse') {
      setMcpName('Remote SSE MCP Server')
      setMcpTransport('sse')
      setMcpUrl('http://127.0.0.1:8000/sse')
      setMcpHeaders('Authorization: Bearer secret-token')
      setMcpCommand('')
      setMcpArgs('')
    }
    setMcpTestResult(null)
  }

  const handleTestMcp = async () => {
    setMcpTesting(true)
    setMcpTestResult(null)
    try {
      const argsList = mcpArgs.trim() ? mcpArgs.split(/\s+/).filter(Boolean) : []
      const headersMap: Record<string, string> = {}
      if (mcpHeaders.trim()) {
        mcpHeaders.split('\n').forEach(line => {
          const [k, ...v] = line.split(':')
          if (k && v.length) headersMap[k.trim()] = v.join(':').trim()
        })
      }

      const res = await testMcpServer({
        name: mcpName,
        transport: mcpTransport,
        command: mcpTransport === 'stdio' ? mcpCommand.trim() : undefined,
        args: mcpTransport === 'stdio' ? argsList : [],
        cwd: mcpCwd.trim() || undefined,
        url: mcpTransport === 'sse' ? mcpUrl.trim() : undefined,
        headers: headersMap,
      })

      setMcpTestResult(res)
      if (res.success) {
        showToast(`Connected to ${res.server_name ?? mcpName} (${res.latency_ms ?? 0}ms)! Discovered ${res.tools.length} tools.`, 'info')
        // Pre-enable all discovered tools
        const toggles: Record<string, boolean> = {}
        res.tools.forEach(t => {
          toggles[t.name] = true
        })
        setMcpToolToggles(toggles)
      } else {
        showToast(`Connection failed: ${res.error ?? 'Unknown error'}`, 'error')
      }
    } catch (err) {
      setMcpTestResult({ success: false, error: (err as Error).message, tools: [] })
      showToast(`MCP Test error: ${(err as Error).message}`, 'error')
    } finally {
      setMcpTesting(false)
    }
  }

  const handleSaveMcp = async () => {
    if (!mcpTestResult || !mcpTestResult.success) {
      showToast('Please test connection successfully before saving.', 'warn')
      return
    }

    setMcpSaving(true)
    try {
      const argsList = mcpArgs.trim() ? mcpArgs.split(/\s+/).filter(Boolean) : []
      const serverId = `mcp-${mcpName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`
      const toolsToSave = mcpTestResult.tools.map(t => ({
        name: t.name,
        enabled: mcpToolToggles[t.name] ?? true,
      }))

      await saveMcpServer({
        id: serverId,
        name: mcpName,
        transport: mcpTransport,
        command: mcpTransport === 'stdio' ? mcpCommand.trim() : undefined,
        args: mcpTransport === 'stdio' ? argsList : [],
        cwd: mcpCwd.trim() || undefined,
        url: mcpTransport === 'sse' ? mcpUrl.trim() : undefined,
        tools: toolsToSave,
      })

      showToast(`Saved MCP Server '${mcpName}' with ${toolsToSave.length} tools!`, 'info')
      refreshData()
      setActiveTab('connected')
    } catch (err) {
      showToast(`Failed to save MCP server: ${(err as Error).message}`, 'error')
    } finally {
      setMcpSaving(false)
    }
  }

  // ── Icons Helper ────────────────────────────────────────────────────────────
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'github':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        )
      case 'terminal':
      case 'chip':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="3" width="16" height="14" rx="2" />
            <polyline points="6 8 9 10 6 12" />
            <line x1="11" y1="12" x2="14" y2="12" />
          </svg>
        )
      case 'globe':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <line x1="2" y1="10" x2="18" y2="10" />
            <path d="M10 2a12 12 0 0 1 0 16M10 2a12 12 0 0 0 0 16" />
          </svg>
        )
      case 'server':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="3" width="16" height="6" rx="1.5" />
            <rect x="2" y="11" width="16" height="6" rx="1.5" />
            <circle cx="5" cy="6" r="1" fill="currentColor" />
            <circle cx="5" cy="14" r="1" fill="currentColor" />
          </svg>
        )
      case 'mail':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="4" width="16" height="12" rx="1.5" />
            <polyline points="2 5 10 11 18 5" />
          </svg>
        )
      case 'calendar':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="4" width="16" height="14" rx="1.5" />
            <line x1="2" y1="8" x2="18" y2="8" />
            <line x1="6" y1="2" x2="6" y2="6" />
            <line x1="14" y1="2" x2="14" y2="6" />
          </svg>
        )
      case 'book':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H16v18H6.5a2.5 2.5 0 0 0-2.5 2.5" />
            <path d="M6 6h6M6 10h6" />
          </svg>
        )
      case 'message-square':
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M18 13a2 2 0 0 1-2 2H5l-3 3V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <polygon points="10 2 18 6 18 14 10 18 2 14 2 6 10 2" />
          </svg>
        )
    }
  }

  return (
    <AppShell>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>Integrations & MCP</h1>
            </div>
            <div className={styles.statsBar}>
              <div className={styles.statBadge}>
                Active Services: <strong>{connected.length}</strong>
              </div>
              <div className={styles.statBadge}>
                Callable Tools: <strong>{totalActiveTools}</strong>
              </div>
            </div>
          </div>
          <p className={styles.description}>
            Manage Model Context Protocol (MCP) clients, local Windows bridges, and official API connections.
            All credentials are stored securely and encrypted locally.
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className={styles.tabNav} aria-label="Integration Views">
          <button
            className={`${styles.tabBtn} ${activeTab === 'connected' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('connected')}
          >
            Connected
            <span className={styles.tabCount}>{connected.length}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'discover' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover Directory
            <span className={styles.tabCount}>{catalog.length}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'custom_mcp' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('custom_mcp')}
          >
            + Add Custom MCP Server
          </button>
        </nav>

        {/* ── TAB 1: CONNECTED ── */}
        {activeTab === 'connected' && (
          <section aria-label="Connected Integrations">
            {loading ? (
              <div className={styles.emptyState}>Loading connected integrations...</div>
            ) : connected.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No external integrations or custom MCP servers connected yet.</p>
                <button className={styles.connectBtn} onClick={() => setActiveTab('discover')}>
                  Browse Directory
                </button>
              </div>
            ) : (
              <div className={styles.connectedGrid}>
                {connected.map(item => {
                  const testState = testResults[item.id]
                  const isCore = item.id === 'windows-native'

                  return (
                    <article key={item.id} className={styles.connectedCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitleGroup}>
                          <div className={styles.serviceIcon}>{renderIcon(item.id.includes('mcp') ? 'server' : item.id)}</div>
                          <div>
                            <h2 className={styles.cardName}>{item.name}</h2>
                            <div className={styles.cardMetaRow}>
                              <span className={styles.typeBadge}>{item.type.replace('_', ' ')}</span>
                              <span className={`${styles.statusIndicator} ${item.status === 'error' ? styles.errorText : ''}`}>
                                <span className={`${styles.statusDot} ${item.status === 'error' ? styles.error : ''}`} />
                                {item.status === 'connected' ? 'Verified Active' : 'Offline / Error'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.account_identity && (
                        <div className={styles.identityRow}>
                          <span className={styles.identityLabel}>Identity:</span>
                          <span>{item.account_identity}</span>
                        </div>
                      )}

                      <div className={styles.syncInfo}>
                        Last Verified:{' '}
                        {item.last_sync
                          ? new Date(item.last_sync * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'Never'}
                        {testState?.latency_ms !== undefined && ` (${testState.latency_ms}ms)`}
                      </div>

                      {/* Tools and Capabilities */}
                      {item.tools && item.tools.length > 0 && (
                        <div className={styles.toolsSection}>
                          <div className={styles.toolsHeader}>
                            <span>Capabilities ({item.tools.filter(t => t.enabled).length}/{item.tools.length} active)</span>
                          </div>
                          <ul className={styles.toolsList} role="list">
                            {item.tools.map(tool => (
                              <li key={tool.name} className={styles.toolItem}>
                                <div className={styles.toolInfo}>
                                  <span className={styles.toolName}>{tool.name}</span>
                                  {tool.description && <span className={styles.toolDesc}>{tool.description}</span>}
                                </div>
                                <label className={styles.toolToggle}>
                                  <input
                                    type="checkbox"
                                    checked={tool.enabled}
                                    onChange={() => handleToggleTool(item.id, tool.name, tool.enabled)}
                                  />
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className={styles.cardActions}>
                        <button
                          className={styles.actionBtn}
                          disabled={testingId === item.id}
                          onClick={() => handleTestExisting(item.id, item.name)}
                        >
                          {testingId === item.id ? 'Testing...' : 'Test Connection'}
                        </button>
                        {!isCore && (
                          <button
                            className={styles.actionBtnDanger}
                            onClick={() => handleDisconnect(item.id, item.name)}
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ── TAB 2: DISCOVER DIRECTORY ── */}
        {activeTab === 'discover' && (
          <section aria-label="Discover Integrations" className={styles.toolbar}>
            {/* Search Input */}
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <circle cx="8.5" cy="8.5" r="5.5" strokeWidth="1.5" />
                <line x1="13" y1="13" x2="18" y2="18" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search integrations by service, capability, or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div className={styles.categoryPills}>
              {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(catKey => (
                <button
                  key={catKey}
                  className={`${styles.catPill} ${selectedCategory === catKey ? styles.activePill : ''}`}
                  onClick={() => setSelectedCategory(catKey)}
                >
                  {CATEGORY_LABELS[catKey]}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className={styles.catalogGrid}>
              {filteredCatalog.map(item => {
                return (
                  <article key={item.id} className={styles.catalogCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitleGroup}>
                        <div className={styles.serviceIcon}>{renderIcon(item.icon)}</div>
                        <div>
                          <h2 className={styles.cardName}>{item.name}</h2>
                          <div className={styles.cardMetaRow}>
                            <span className={styles.typeBadge}>{item.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className={styles.catalogDesc}>{item.description}</p>

                    <div className={styles.capabilitiesTags}>
                      {item.capabilities.map(cap => (
                        <span key={cap} className={styles.capTag}>
                          {cap}
                        </span>
                      ))}
                    </div>

                    {item.is_connected ? (
                      <button
                        className={styles.configuredBtn}
                        onClick={() => setActiveTab('connected')}
                      >
                        ✓ Configured & Active
                      </button>
                    ) : item.status === 'coming_soon' ? (
                      <div className={styles.comingSoonBadge}>Under Development</div>
                    ) : item.type === 'mcp_server' ? (
                      <button
                        className={styles.connectBtn}
                        onClick={() => {
                          if (item.id === 'zaid-local-tools') {
                            applyMcpPreset('local')
                          } else if (item.id === 'mcp-filesystem') {
                            applyMcpPreset('filesystem')
                          }
                          setActiveTab('custom_mcp')
                        }}
                      >
                        Configure MCP Server
                      </button>
                    ) : (
                      <button
                        className={styles.connectBtn}
                        onClick={() => openGuidedModal(item)}
                      >
                        Connect {item.name}
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* ── TAB 3: ADD CUSTOM MCP SERVER ── */}
        {activeTab === 'custom_mcp' && (
          <section aria-label="Add Custom MCP Server" className={styles.wizardContainer}>
            <header className={styles.wizardHeader}>
              <h2 className={styles.wizardTitle}>Connect Model Context Protocol (MCP) Server</h2>
              <p className={styles.description}>
                Standard MCP connection interface supporting stdio (local executable processes) and remote SSE (Server-Sent Events) transports.
              </p>
            </header>

            {/* Presets Bar */}
            <div className={styles.presetsBar}>
              <span className={styles.presetLabel}>Quick Presets:</span>
              <button type="button" className={styles.presetBtn} onClick={() => applyMcpPreset('local')}>
                ZAID Local Tools
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => applyMcpPreset('filesystem')}>
                Filesystem MCP
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => applyMcpPreset('sse')}>
                Remote SSE Endpoint
              </button>
            </div>

            {/* Security Notice */}
            <div className={styles.securityWarning}>
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2L2 17h16L10 2zM10 8v4M10 14h.01" />
              </svg>
              <div>
                <strong>Security Notice:</strong> MCP servers execute with permissions granted to the host process or local machine.
                Only connect servers from verified authors and inspect discovered tools before authorization.
              </div>
            </div>

            <form
              className={styles.formGrid}
              onSubmit={e => {
                e.preventDefault()
                handleTestMcp()
              }}
            >
              {/* Server Name */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="mcp-name">
                  Server Name
                </label>
                <input
                  id="mcp-name"
                  type="text"
                  className={styles.formInput}
                  value={mcpName}
                  onChange={e => setMcpName(e.target.value)}
                  required
                />
              </div>

              {/* Transport Selection */}
              <div className={styles.formGroup}>
                <span className={styles.formLabel}>Transport Protocol</span>
                <div className={styles.transportSelector}>
                  <label
                    className={`${styles.transportOption} ${mcpTransport === 'stdio' ? styles.selected : ''}`}
                    onClick={() => setMcpTransport('stdio')}
                  >
                    <input
                      type="radio"
                      name="transport"
                      value="stdio"
                      checked={mcpTransport === 'stdio'}
                      onChange={() => setMcpTransport('stdio')}
                    />
                    stdio (Local Process Command)
                  </label>
                  <label
                    className={`${styles.transportOption} ${mcpTransport === 'sse' ? styles.selected : ''}`}
                    onClick={() => setMcpTransport('sse')}
                  >
                    <input
                      type="radio"
                      name="transport"
                      value="sse"
                      checked={mcpTransport === 'sse'}
                      onChange={() => setMcpTransport('sse')}
                    />
                    SSE (Remote Server-Sent Events)
                  </label>
                </div>
              </div>

              {/* Stdio Specific Fields */}
              {mcpTransport === 'stdio' ? (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="mcp-cmd">
                      Command / Executable
                    </label>
                    <input
                      id="mcp-cmd"
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. python, npx, node, or full path to executable"
                      value={mcpCommand}
                      onChange={e => setMcpCommand(e.target.value)}
                      required
                    />
                    <span className={styles.formHelp}>Command to launch the MCP server subprocess.</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="mcp-args">
                      Arguments (space-separated)
                    </label>
                    <input
                      id="mcp-args"
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. D:/ZAID/backend/integrations/local_mcp_server.py"
                      value={mcpArgs}
                      onChange={e => setMcpArgs(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="mcp-cwd">
                      Working Directory (Optional)
                    </label>
                    <input
                      id="mcp-cwd"
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. D:/ZAID"
                      value={mcpCwd}
                      onChange={e => setMcpCwd(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="mcp-url">
                      Remote Endpoint URL
                    </label>
                    <input
                      id="mcp-url"
                      type="url"
                      className={styles.formInput}
                      placeholder="https://example.com/sse or http://127.0.0.1:8080/sse"
                      value={mcpUrl}
                      onChange={e => setMcpUrl(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="mcp-headers">
                      Custom HTTP Headers (Header: Value per line)
                    </label>
                    <textarea
                      id="mcp-headers"
                      rows={3}
                      className={styles.formInput}
                      placeholder="Authorization: Bearer my-secret-token"
                      value={mcpHeaders}
                      onChange={e => setMcpHeaders(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className={styles.wizardActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  disabled={mcpTesting}
                  onClick={handleTestMcp}
                >
                  {mcpTesting ? 'Testing Connection & Discovering Tools...' : 'Test Connection & Discover Tools'}
                </button>
              </div>
            </form>

            {/* Test Results Display */}
            {mcpTestResult && (
              <div className={styles.testResultBox}>
                <div className={styles.testHeader}>
                  <span className={`${styles.statusIndicator} ${!mcpTestResult.success ? styles.errorText : ''}`}>
                    <span className={`${styles.statusDot} ${!mcpTestResult.success ? styles.error : ''}`} />
                    {mcpTestResult.success ? `Connected (${mcpTestResult.latency_ms ?? 0}ms)` : 'Connection Test Failed'}
                  </span>
                  {mcpTestResult.server_name && (
                    <span className={styles.syncInfo}>Server: {mcpTestResult.server_name}</span>
                  )}
                </div>

                {!mcpTestResult.success ? (
                  <div className={styles.errorBanner}>{mcpTestResult.error}</div>
                ) : (
                  <>
                    <div className={styles.toolsHeader}>
                      <span>Discovered Tools ({mcpTestResult.tools.length})</span>
                      <span className={styles.formHelp}>Review and enable permissions before saving</span>
                    </div>

                    <table className={styles.discoveredToolsTable}>
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>Permit</th>
                          <th>Tool Name</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mcpTestResult.tools.map(tool => (
                          <tr key={tool.name}>
                            <td>
                              <input
                                type="checkbox"
                                checked={mcpToolToggles[tool.name] ?? true}
                                onChange={e => {
                                  setMcpToolToggles(prev => ({
                                    ...prev,
                                    [tool.name]: e.target.checked,
                                  }))
                                }}
                              />
                            </td>
                            <td><strong>{tool.name}</strong></td>
                            <td>{tool.description || 'No description provided'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.wizardActions}>
                      <button
                        type="button"
                        className={styles.connectBtn}
                        disabled={mcpSaving}
                        onClick={handleSaveMcp}
                      >
                        {mcpSaving ? 'Saving...' : 'Authorize & Save Integration'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── GUIDED CONNECTION MODAL ── */}
        {modalService && (
          <div className={styles.modalBackdrop} onClick={() => setModalService(null)}>
            <div
              className={styles.modalDialog}
              role="dialog"
              aria-modal="true"
              onClick={e => e.stopPropagation()}
            >
              <button
                className={styles.modalCloseBtn}
                onClick={() => setModalService(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>

              <div className={styles.modalHeader}>
                <div className={styles.serviceIcon}>{renderIcon(modalService.icon)}</div>
                <div>
                  <h2 className={styles.cardName}>Connect {modalService.name}</h2>
                  <span className={styles.typeBadge}>{modalService.type.replace('_', ' ')}</span>
                </div>
              </div>

              <p className={styles.catalogDesc}>{modalService.description}</p>

              <div className={styles.formGroup}>
                <span className={styles.formLabel}>Prerequisites & Guide:</span>
                <p className={styles.formHelp}>{modalService.setup_guide}</p>
                {modalService.doc_url && (
                  <a
                    href={modalService.doc_url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.docLink}
                  >
                    Open {modalService.name} Developer Setup Page →
                  </a>
                )}
              </div>

              {/* Token Input for Official API */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="service-token">
                  API Key / Access Token
                </label>
                <div className={styles.secretInputWrapper}>
                  <input
                    id="service-token"
                    type={modalShowSecret ? 'text' : 'password'}
                    className={styles.formInput}
                    placeholder="Paste authentication secret or token..."
                    value={modalToken}
                    onChange={e => setModalToken(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.showSecretBtn}
                    onClick={() => setModalShowSecret(prev => !prev)}
                  >
                    {modalShowSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Test diagnostics feedback */}
              {modalTestRes && (
                <div>
                  {modalTestRes.success ? (
                    <div className={styles.successBanner}>
                      ✓ Verified Identity: <strong>{modalTestRes.account_identity}</strong>
                    </div>
                  ) : (
                    <div className={styles.errorBanner}>
                      ✗ Verification Failed: {modalTestRes.error}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.wizardActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  disabled={modalTesting || !modalToken.trim()}
                  onClick={handleModalTest}
                >
                  {modalTesting ? 'Verifying...' : 'Verify Token'}
                </button>
                <button
                  type="button"
                  className={styles.connectBtn}
                  disabled={modalSaving || !modalTestRes?.success}
                  onClick={handleModalSave}
                >
                  {modalSaving ? 'Saving...' : 'Complete Connection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
