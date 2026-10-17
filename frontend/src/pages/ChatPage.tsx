import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { StatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { streamChat, getChatStatus } from '../api/client'
import type { ChatMessage } from '../types'
import styles from './ChatPage.module.css'

let _msgId = 1
const nextId = () => String(_msgId++)

// Web Speech API shims
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}
interface SpeechRecognitionInstance {
  continuous: boolean; interimResults: boolean; lang: string
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void
}

// Available model options (can add more as you pull them)
const MODEL_OPTIONS = [
  { value: 'qwen2.5:0.5b', label: 'Qwen 2.5 · 0.5B (FAST — recommended for CPU)' },
  { value: 'qwen3.5:4b',   label: 'Qwen 3.5 · 4B (SLOW on CPU — best quality)' },
]

// ── Text-to-Speech helper ────────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()  // cancel any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 1.05
  utterance.pitch = 1.0
  // prefer a natural voice if available
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  )
  if (preferred) utterance.voice = preferred
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export default function ChatPage() {
  const [messages, setMessages]       = useState<ChatMessage[]>([])
  const [input, setInput]             = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [selectedModel, setSelectedModel] = useState('qwen2.5:0.5b')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking]   = useState(false)
  const [ttsEnabled, setTtsEnabled]   = useState(true)
  const [voiceAvailable, setVoiceAvailable] = useState(false)
  const [ttsAvailable, setTtsAvailable]   = useState(false)
  const liveRegionId = useId()
  const listEndRef    = useRef<HTMLDivElement>(null)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const abortRef      = useRef<AbortController | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const historyRef    = useRef<{ role: string; content: string }[]>([])

  // Check backend + capabilities
  useEffect(() => {
    getChatStatus()
      .then(s => setBackendStatus(s.connected && s.model_present ? 'connected' : 'disconnected'))
      .catch(() => setBackendStatus('disconnected'))

    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition
    setVoiceAvailable(!!SpeechRec)
    setTtsAvailable(!!window.speechSynthesis)

    // Pre-load voices (Chrome requires this)
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg])
    scrollToBottom()
  }, [scrollToBottom])

  const sendMessage = useCallback(() => {
    const text = input.trim()
    if (!text || isStreaming) return

    addMessage({ id: nextId(), role: 'user', content: text, timestamp: Date.now() })
    setInput('')

    if (backendStatus !== 'connected') {
      addMessage({
        id: nextId(), role: 'system-notice',
        content: '⚠ Backend not running. Open a terminal and run:\ncd D:\\ZAID\\backend\n.venv\\Scripts\\uvicorn main:app --host 127.0.0.1 --port 8000',
        timestamp: Date.now(),
      })
      return
    }

    historyRef.current = [...historyRef.current, { role: 'user', content: text }]

    const asstId = nextId()
    setMessages(prev => [...prev, { id: asstId, role: 'assistant', content: '', timestamp: Date.now() }])
    setIsStreaming(true)
    scrollToBottom()

    let accumulated = ''
    abortRef.current = streamChat(
      historyRef.current,
      (token) => {
        accumulated += token
        setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: accumulated } : m))
      },
      () => {
        setIsStreaming(false)
        historyRef.current = [...historyRef.current, { role: 'assistant', content: accumulated }]
        textareaRef.current?.focus()
        scrollToBottom()
        // ── TTS: AI speaks the response ──
        if (ttsEnabled && accumulated) {
          setIsSpeaking(true)
          speak(accumulated, () => setIsSpeaking(false))
        }
      },
      (err) => {
        setIsStreaming(false)
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: `⚠ Error: ${err}`, role: 'system-notice' } : m
        ))
        scrollToBottom()
      },
      selectedModel,
    )
  }, [input, isStreaming, backendStatus, addMessage, scrollToBottom, ttsEnabled, selectedModel])

  const stopAll = useCallback(() => {
    abortRef.current?.abort()
    window.speechSynthesis?.cancel()
    setIsStreaming(false)
    setIsSpeaking(false)
  }, [])

  const toggleMic = useCallback(() => {
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRec) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    // Stop TTS while listening
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)

    const rec = new SpeechRec()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e) => {
      const parts: string[] = []
      for (let i = 0; i < Object.keys(e.results).length; i++) {
        parts.push(e.results[i][0].transcript)
      }
      setInput(parts.join(''))
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => {
      setIsListening(false)
      // Auto-send after voice if text was captured
      setTimeout(() => {
        setInput(prev => {
          if (prev.trim()) {
            // Trigger send via a synthetic submit
            document.getElementById('chat-send-btn')?.click()
          }
          return prev
        })
      }, 300)
    }
    rec.start()
    recognitionRef.current = rec
    setIsListening(true)
  }, [isListening])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim() && !isStreaming) sendMessage() }
  }

  const canSend = input.trim().length > 0 && !isStreaming

  return (
    <AppShell>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Chat</h1>
            <select className={styles.modelSelect}
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              aria-label="Select AI model">
              {MODEL_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.headerRight}>
            {backendStatus === 'checking'      && <StatusBadge variant="unavailable"  label="CHECKING…"     />}
            {backendStatus === 'connected'     && <StatusBadge variant="connected"    label="CONNECTED"     />}
            {backendStatus === 'disconnected'  && <StatusBadge variant="disconnected" label="NOT CONNECTED" />}
            {ttsAvailable && (
              <button className={`${styles.ttsToggle} ${ttsEnabled ? styles.ttsOn : ''}`}
                onClick={() => { setTtsEnabled(p => !p); window.speechSynthesis?.cancel(); setIsSpeaking(false) }}
                title={ttsEnabled ? 'AI voice ON — click to mute' : 'AI voice OFF — click to enable'}
                aria-label={ttsEnabled ? 'Disable AI voice' : 'Enable AI voice'}>
                {ttsEnabled ? '🔊' : '🔇'}
              </button>
            )}
          </div>
        </header>

        {/* Speed warning for large model */}
        {selectedModel === 'qwen3.5:4b' && backendStatus === 'connected' && (
          <div className={styles.warningBanner} role="alert">
            ⚠ <strong>4B model on CPU</strong> — expect 3-7 min per response. Switch to <strong>Qwen 2.5 · 0.5B</strong> for fast replies (~5 sec).
          </div>
        )}

        {backendStatus === 'disconnected' && (
          <div className={styles.offlineBanner} role="alert">
            ⚠ Backend not running. In a terminal:&nbsp;
            <code>cd D:\ZAID\backend</code>&nbsp;→&nbsp;
            <code>.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000</code>
          </div>
        )}

        {isSpeaking && (
          <div className={styles.speakingBar} aria-live="polite">
            🔊 AI is speaking…
            <button onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false) }}
              className={styles.stopSpeakBtn}>Stop</button>
          </div>
        )}

        {/* Message list */}
        <div className={styles.messageList} aria-label="Conversation" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <EmptyState icon="💬" title="Start a conversation"
              description={backendStatus === 'connected'
                ? `Using ${selectedModel}. Type or press the mic button to speak.`
                : 'Start the backend to enable AI chat.'} />
          ) : messages.map(msg => (
            <div key={msg.id} className={`${styles.bubble} ${styles[msg.role.replace('-', '_')]}`}>
              <span className={styles.roleLabel}>
                {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? selectedModel : '⚠ System'}
              </span>
              <p className={styles.messageText}>
                {msg.content || (isStreaming && msg.role === 'assistant'
                  ? <span className={styles.cursor}>▌</span> : null)}
              </p>
              {msg.role === 'assistant' && msg.content.includes('is not connected yet') && (
                <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <Link
                    to="/integrations"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--orange)',
                      color: 'var(--bg-0)',
                      fontWeight: 700,
                      fontSize: 'var(--fs-xs)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    🔌 Connect Integration in ZAID →
                  </Link>
                </div>
              )}
              <div className={styles.msgFooter}>
                <time className={styles.timestamp} dateTime={new Date(msg.timestamp).toISOString()}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </time>
                {msg.role === 'assistant' && msg.content && ttsAvailable && (
                  <button className={styles.speakBtn}
                    onClick={() => speak(msg.content)}
                    title="Read this message aloud" aria-label="Read aloud">🔊</button>
                )}
              </div>
            </div>
          ))}
          <div ref={listEndRef} aria-hidden="true" />
        </div>

        <div id={liveRegionId} className="visually-hidden" aria-live="polite" aria-atomic="true" />

        {/* Composer */}
        <div className={styles.composer}>
          {voiceAvailable && (
            <button className={`${styles.voiceBtn} ${isListening ? styles.voiceActive : ''}`}
              onClick={toggleMic}
              aria-label={isListening ? 'Stop listening' : 'Speak your message (mic)'}
              title={isListening ? 'Listening… click to stop' : 'Click to speak (Chrome/Edge only)'}
              type="button">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="9" y="2" width="6" height="13" rx="3"/>
                <path d="M5 10 Q5 18 12 18 Q19 18 19 10"/>
                <line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round"/>
                <line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
              {isListening && <span className={styles.micLabel}>Listening…</span>}
            </button>
          )}
          <textarea ref={textareaRef} id="chat-input" className={styles.textarea}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎤 Speak now — auto-sends when done' : 'Type a message… (Enter to send, Shift+Enter for new line)'}
            aria-label="Message input" rows={3} disabled={isStreaming} autoComplete="off" spellCheck />
          {isStreaming || isSpeaking ? (
            <button className={`${styles.sendBtn} ${styles.stopBtn}`}
              onClick={stopAll} aria-label="Stop" type="button">Stop</button>
          ) : (
            <button id="chat-send-btn" className={styles.sendBtn}
              onClick={sendMessage} disabled={!canSend} aria-disabled={!canSend} aria-label="Send message" type="button">
              Send
            </button>
          )}
        </div>

        {!voiceAvailable && (
          <p className={styles.voiceNote}>
            🎤 Voice input requires <strong>Chrome or Edge</strong>. Firefox/Safari don't support Web Speech API.
          </p>
        )}
      </div>
    </AppShell>
  )
}
