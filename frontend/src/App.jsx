import { useState, useRef, useEffect } from 'react'
import './App.css'

const TOPICS = {
  science: ['science', 'physics', 'chemistry', 'biology', 'atom', 'quantum', 'space', 'planet', 'experiment', 'energy', 'gravity', 'evolution', 'cell', 'dna'],
  coding: ['code', 'program', 'function', 'bug', 'javascript', 'python', 'api', 'database', 'algorithm', 'react', 'html', 'css', 'error', 'debug', 'software'],
  math: ['math', 'calculate', 'equation', 'algebra', 'geometry', 'calculus', 'number', 'formula', 'theorem', 'proof', 'integral', 'derivative', 'matrix'],
  history: ['history', 'ancient', 'century', 'war', 'civilization', 'empire', 'revolution', 'historical', 'culture', 'dynasty', 'medieval', 'colonial'],
  creative: ['write', 'story', 'poem', 'creative', 'art', 'imagine', 'fiction', 'character', 'plot', 'narrative', 'design', 'music', 'lyrics'],
  casual: ['funny', 'joke', 'fun', 'game', 'movie', 'food', 'travel', 'hobby', 'recommend', 'suggest', 'opinion', 'think', 'feel'],
}

const PERSONAS = {
  science: { name: 'Prof. Nova', emoji: '🔭', role: 'Science Teacher', systemPrompt: 'You are Prof. Nova, an enthusiastic and brilliant science teacher. You explain concepts with vivid real-world examples, use analogies effectively, and make science genuinely exciting. You love thought experiments and connect ideas across disciplines.' },
  coding:  { name: 'Dev.exe',   emoji: '💻', role: 'Code Expert',     systemPrompt: 'You are Dev.exe, a sharp and experienced senior software engineer. You write clean, efficient code, explain technical concepts clearly, debug methodically, and always share best practices and potential gotchas.' },
  math:    { name: 'Euler',     emoji: '📐', role: 'Math Genius',     systemPrompt: 'You are Euler, a brilliant mathematician with a gift for clarity. You solve problems step by step, explain reasoning beautifully, and reveal the elegant logic behind mathematics. You find math deeply beautiful.' },
  history: { name: 'Chronicle', emoji: '📜', role: 'History Scholar', systemPrompt: 'You are Chronicle, a passionate history scholar. You bring historical events to life with vivid storytelling, connect past to present, and provide deep context. You see patterns across civilizations.' },
  creative:{ name: 'Muse',      emoji: '🎨', role: 'Creative Writer', systemPrompt: 'You are Muse, a wildly creative writer and artist. You craft beautiful prose, help with creative projects, inspire imagination, and bring a poetic sensibility to every response. You think in metaphors.' },
  casual:  { name: 'Buddy',     emoji: '😄', role: 'Fun Companion',   systemPrompt: 'You are Buddy, an upbeat and fun companion. You are warm, witty, tell great jokes, share cool facts, and make every conversation feel like chatting with a good friend.' },
  default: { name: 'Sage',      emoji: '🧠', role: 'AI Assistant',    systemPrompt: 'You are Sage, a helpful AI assistant. You answer all questions directly and honestly without refusing or adding unnecessary warnings. You never lecture or moralize. Just help.' },
}

const THEMES = [
  { id: 'dark',   label: 'Dark',   emoji: '🌑', dot: '#7c8fff' },
  { id: 'light',  label: 'Light',  emoji: '☀️',  dot: '#5c6fff' },
  { id: 'forest', label: 'Forest', emoji: '🌿', dot: '#4caf50' },
  { id: 'sunset', label: 'Sunset', emoji: '🌅', dot: '#ff6b35' },
  { id: 'ocean',  label: 'Ocean',  emoji: '🌊', dot: '#00bcd4' },
  { id: 'neon',   label: 'Neon',   emoji: '⚡', dot: '#ff00ff' },
]

const SUGGESTIONS = [
  { icon: '🔭', text: 'Explain how black holes work' },
  { icon: '💻', text: 'Help me write a Python function' },
  { icon: '📐', text: 'What is the Pythagorean theorem?' },
  { icon: '🎨', text: 'Write me a short creative story' },
]

const STORAGE_KEY = 'localai_chats'

function detectPersona(messages) {
  if (messages.length < 3) return PERSONAS.default
  const text = messages.filter(m => m.role === 'user').map(m => m.content).join(' ').toLowerCase()
  let max = 0, best = 'default'
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    const score = keywords.filter(k => text.includes(k)).length
    if (score > max) { max = score; best = topic }
  }
  return max >= 2 ? PERSONAS[best] : PERSONAS.default
}

function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function saveChats(chats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

function generateTitle(messages) {
  const first = messages.find(m => m.role === 'user')
  if (!first) return 'New Chat'
  return first.content.slice(0, 40) + (first.content.length > 40 ? '...' : '')
}

function formatDate(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

export default function App() {
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [streaming, setStreaming]       = useState(false)
  const [theme, setTheme]               = useState('dark')
  const [persona, setPersona]           = useState(PERSONAS.default)
  const [copied, setCopied]             = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showThemes, setShowThemes]     = useState(false)
  const [toast, setToast]               = useState(null)
  const [settings, setSettings]         = useState({ temperature: 0.7, formality: 'balanced', length: 'normal' })
  const [chats, setChats]               = useState(loadChats)
  const [activeChatId, setActiveChatId] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)
  const abortRef       = useRef(null)

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    if (messages.length >= 3) {
      const next = detectPersona(messages)
      if (next.name !== persona.name) {
        setPersona(next)
        triggerToast(`🎭 ${next.name} activated — ${next.role}`)
      }
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) return
    const updated = chats.map(c =>
      c.id === activeChatId ? { ...c, messages, title: generateTitle(messages), updatedAt: Date.now() } : c
    )
    if (!activeChatId || !chats.find(c => c.id === activeChatId)) {
      const newChat = {
        id: Date.now().toString(),
        title: generateTitle(messages),
        messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setActiveChatId(newChat.id)
      const newChats = [newChat, ...chats]
      setChats(newChats)
      saveChats(newChats)
    } else {
      setChats(updated)
      saveChats(updated)
    }
  }, [messages])

  const triggerToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const buildSystemPrompt = () => {
    const fm = { casual: 'Be casual and conversational.', balanced: 'Be clear and approachable.', professional: 'Be formal and precise.' }
    const lm = { brief: 'Keep answers short and to the point.', normal: 'Give appropriate detail.', detailed: 'Be comprehensive with examples.' }
    return `${persona.systemPrompt} ${fm[settings.formality]} ${lm[settings.length]}`
  }

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || loading || streaming) return
    const userMsg = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, temperature: settings.temperature, system_prompt: buildSystemPrompt() }),
        signal: abortRef.current.signal
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiReply = ''

      setMessages([...updated, { role: 'assistant', content: '' }])
      setLoading(false)
      setStreaming(true)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const token = decoder.decode(value)
        aiReply += token
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: aiReply }
          return next
        })
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages([...updated, { role: 'assistant', content: '⚠️ Backend not reachable. Make sure it is running!' }])
      }
    } finally {
      setLoading(false)
      setStreaming(false)
      abortRef.current = null
      textareaRef.current?.focus()
    }
  }

  const stopMessage = () => {
    if (abortRef.current) abortRef.current.abort()
    setLoading(false)
    setStreaming(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const copyText = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000) }

  const startNewChat = () => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setActiveChatId(null)
    setPersona(PERSONAS.default)
    setShowSettings(false)
    setLoading(false)
    setStreaming(false)
  }

  const loadChat = (chat) => {
    if (abortRef.current) abortRef.current.abort()
    setMessages(chat.messages)
    setActiveChatId(chat.id)
    setPersona(detectPersona(chat.messages))
    setShowSettings(false)
    setLoading(false)
    setStreaming(false)
  }

  const deleteChat = (e, id) => {
    e.stopPropagation()
    const updated = chats.filter(c => c.id !== id)
    setChats(updated)
    saveChats(updated)
    if (activeChatId === id) startNewChat()
    triggerToast('🗑️ Chat deleted')
  }

  const isElectron = !!window.electronAPI

  return (
    <div className="app" style={{ flexDirection: 'column' }}>
      <div className="bg-blobs">
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      </div>

      {toast && <div className="toast">{toast}</div>}

      {isElectron && (
        <div className="title-bar">
          <div className="title-bar-left">
            <div className="status-dot" />
            <span>{persona.emoji} {persona.name}</span>
            <span className="title-bar-sub">— {persona.role}</span>
          </div>
          <div className="title-bar-controls">
            <button className="icon-btn" title="Settings" onClick={() => setShowSettings(s => !s)}>⚙️</button>
            <button className="icon-btn" title="Clear" onClick={startNewChat}>🗑️</button>
            <div style={{ width: 8 }} />
            <button className="tb-btn tb-min" onClick={() => window.electronAPI.minimize()} />
            <button className="tb-btn tb-max" onClick={() => window.electronAPI.maximize()} />
            <button className="tb-btn tb-close" onClick={() => window.electronAPI.close()} />
          </div>
        </div>
      )}

      <div className={`main-body ${isElectron ? 'electron-mode' : ''}`}>
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🧠</div>
            <div><h2>Local AI</h2><span>Private & Offline</span></div>
          </div>

          <button className="new-chat-btn" onClick={startNewChat}>✚ New Chat</button>

          <button className="section-toggle" onClick={() => setShowThemes(t => !t)}>
            🎨 Themes {showThemes ? '▲' : '▼'}
          </button>
          {showThemes && (
            <div className="themes-grid">
              {THEMES.map(t => (
                <button key={t.id} data-t={t.id} className={`theme-btn ${theme === t.id ? 'active' : ''}`} onClick={() => setTheme(t.id)}>
                  <div className="theme-dot" style={{ background: t.dot }} />{t.emoji} {t.label}
                </button>
              ))}
            </div>
          )}

          {messages.length >= 3 && (
            <div className="persona-card">
              <div className="persona-avatar">{persona.emoji}</div>
              <div><div className="persona-name">{persona.name}</div><div className="persona-role">{persona.role}</div></div>
            </div>
          )}

          <div className="sidebar-section-title">
            💬 Recent Chats {chats.length > 0 && <span className="chat-count">{chats.length}</span>}
          </div>

          <div className="chat-history-list">
            {chats.length === 0 && (
              <div className="no-chats">No chats yet. Start a conversation!</div>
            )}
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-history-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => loadChat(chat)}
              >
                <div className="chat-history-icon">💬</div>
                <div className="chat-history-info">
                  <div className="chat-history-title">{chat.title}</div>
                  <div className="chat-history-date">{formatDate(chat.updatedAt)}</div>
                </div>
                <button className="chat-delete-btn" onClick={(e) => deleteChat(e, chat.id)}>🗑️</button>
              </div>
            ))}
          </div>

          <div className="model-info">
            <div>🤖 <span className="info-label">Model:</span> Llama 3.2:3b</div>
            <div>🔒 <span className="info-label">Privacy:</span> 100% Local</div>
            <div>⚡ <span className="info-label">Backend:</span> FastAPI</div>
          </div>
        </div>

        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="status-dot" />
              <div>
                <div className="chat-header-title">{persona.emoji} {persona.name}</div>
                <div className="chat-header-sub">{persona.role} — Running locally</div>
              </div>
            </div>
            <div className="header-actions">
              <button className="icon-btn" title="Settings" onClick={() => setShowSettings(s => !s)}>⚙️</button>
              <button className="icon-btn" title="Clear" onClick={startNewChat}>🗑️</button>
            </div>
          </div>

          <div className="chat-body">
            <div className="messages">
              {messages.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🧠</div>
                  <h1>Ask me anything</h1>
                  <p>Your private AI — running on your machine. Ask science questions to meet Prof. Nova, code questions for Dev.exe, and more!</p>
                  <div className="suggestions">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} className="suggestion-chip" onClick={() => sendMessage(s.text)}>{s.icon} {s.text}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`} style={{ '--i': i }}>
                  <div className="avatar">{msg.role === 'user' ? '👤' : persona.emoji}</div>
                  <div className="message-content">
                    <div className="message-label">{msg.role === 'user' ? 'You' : persona.name}</div>
                    <div className="message-bubble">
                      {msg.content}
                      {msg.role === 'assistant' && msg.content && (
                        <button className="copy-btn" onClick={() => copyText(msg.content, i)}>
                          {copied === i ? '✅' : '📋'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message assistant">
                  <div className="avatar">{persona.emoji}</div>
                  <div className="message-content">
                    <div className="message-label">{persona.name}</div>
                    <div className="message-bubble">
                      <div className="typing-indicator"><span /><span /><span /></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showSettings && (
              <div className="settings-panel">
                <div className="settings-header">
                  <span>⚙️ Personality Controls</span>
                  <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
                </div>
                <div className="setting-group">
                  <label>🎨 Creativity — <strong>{settings.temperature.toFixed(1)}</strong></label>
                  <input type="range" min="0.1" max="2.0" step="0.1" value={settings.temperature}
                    onChange={e => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))} />
                  <div className="range-labels"><span>Focused</span><span>Balanced</span><span>Wild</span></div>
                </div>
                <div className="setting-group">
                  <label>🎩 Formality</label>
                  <div className="toggle-group">
                    {['casual', 'balanced', 'professional'].map(f => (
                      <button key={f} className={`toggle-btn ${settings.formality === f ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, formality: f }))}>
                        {f === 'casual' ? '😄' : f === 'balanced' ? '🤝' : '💼'} {f[0].toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="setting-group">
                  <label>📏 Response Length</label>
                  <div className="toggle-group">
                    {['brief', 'normal', 'detailed'].map(l => (
                      <button key={l} className={`toggle-btn ${settings.length === l ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, length: l }))}>
                        {l === 'brief' ? '⚡' : l === 'normal' ? '📝' : '📚'} {l[0].toUpperCase() + l.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="settings-preview">
                  Mode: <strong>{settings.temperature < 0.5 ? 'Precise 🎯' : settings.temperature < 1.2 ? 'Balanced ⚖️' : 'Creative 🌀'}</strong>
                  {' · '}<strong>{settings.formality}</strong>
                  {' · '}<strong>{settings.length}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="input-wrapper">
            <div className="input-area">
              <textarea ref={textareaRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${persona.name}... (Enter to send)`}
                rows={1}
              />
              {(loading || streaming)
                ? <button className="send-btn stop-btn" onClick={stopMessage}>⏹</button>
                : <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim()}>➤</button>
              }
            </div>
            <div className="input-hint">Enter to send · Shift+Enter for new line · ⚙️ for personality settings</div>
          </div>
        </div>
      </div>
    </div>
  )
}