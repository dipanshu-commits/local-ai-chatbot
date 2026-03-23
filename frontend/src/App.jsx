import { useState, useEffect } from 'react'
import ChatPage from './pages/ChatPage'
import RoleplayPage from './pages/RoleplayPage'
import './App.css'

export default function App() {
  const [tab, setTab]     = useState('chat')
  const [theme, setTheme] = useState('dark')
  const isElectron        = !!window.electronAPI

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app" style={{ flexDirection: 'column' }}>
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* TITLE BAR — Electron only */}
      {isElectron && (
        <div className="title-bar">
          <div className="title-bar-left">
            <div className="status-dot" />
            <span>🧠 Local AI</span>
          </div>
          <div className="title-bar-controls">
            {/* TAB SWITCHER inside title bar */}
            <div className="tab-switcher">
              <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>💬 Chat</button>
              <button className={`tab-btn ${tab === 'roleplay' ? 'active' : ''}`} onClick={() => setTab('roleplay')}>🎭 Roleplay</button>
            </div>
            <div style={{ width: 12 }} />
            <button className="tb-btn tb-min" onClick={() => window.electronAPI.minimize()} />
            <button className="tb-btn tb-max" onClick={() => window.electronAPI.maximize()} />
            <button className="tb-btn tb-close" onClick={() => window.electronAPI.close()} />
          </div>
        </div>
      )}

      {/* TAB BAR — Browser only */}
      {!isElectron && (
        <div className="browser-tab-bar">
          <div className="browser-logo">🧠 Local AI</div>
          <div className="tab-switcher">
            <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>💬 Chat</button>
            <button className={`tab-btn ${tab === 'roleplay' ? 'active' : ''}`} onClick={() => setTab('roleplay')}>🎭 Roleplay</button>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className={`page-content ${isElectron ? 'electron-mode' : ''}`}>
        {tab === 'chat'
          ? <ChatPage theme={theme} setTheme={setTheme} isElectron={isElectron} />
          : <RoleplayPage />
        }
      </div>
    </div>
  )
}