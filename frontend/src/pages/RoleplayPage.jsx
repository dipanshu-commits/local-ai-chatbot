import { useState } from 'react'
import { useRoleplay, getMoodLabel } from '../hooks/useRoleplay'
import CharacterCard from '../components/CharacterCard'
import CharacterCreator from '../components/CharacterCreator'
import SceneCreator from '../components/SceneCreator'
import SceneChat from '../components/SceneChat'

export default function RoleplayPage() {
  const {
    characters, scenes,
    createCharacter, deleteCharacter, updateMood, addMemory, clearMemory,
    createScene, deleteScene
  } = useRoleplay()

  const [activeCharacter, setActiveCharacter] = useState(null)
  const [activeScene, setActiveScene]         = useState(null)
  const [showCreator, setShowCreator]         = useState(false)
  const [showSceneCreator, setShowSceneCreator] = useState(false)
  const [chatMessages, setChatMessages]       = useState([])
  const [input, setInput]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [streaming, setStreaming]             = useState(false)
  const [toast, setToast]                     = useState(null)
  const abortRef = useState(null)

  const triggerToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const startChat = (character) => {
    setActiveCharacter(character)
    setActiveScene(null)
    setChatMessages([])
  }

  const startScene = (scene) => {
    setActiveScene(scene)
    setActiveCharacter(null)
    setChatMessages([])
  }

  const handleSaveCharacter = (data) => {
    createCharacter(data)
    setShowCreator(false)
    triggerToast('🎭 Character created!')
  }

  const handleSaveScene = (data) => {
    createScene(data)
    setShowSceneCreator(false)
    triggerToast('🎬 Scene created!')
  }

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || loading || streaming || !activeCharacter) return

    const { buildCharacterPrompt } = await import('../hooks/useRoleplay')
    const userMsg = { role: 'user', content }
    const updated = [...chatMessages, userMsg]
    setChatMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          temperature: 0.8,
          system_prompt: buildCharacterPrompt(activeCharacter)
        })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiReply = ''

      setChatMessages([...updated, { role: 'assistant', content: '' }])
      setLoading(false)
      setStreaming(true)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiReply += decoder.decode(value)
        setChatMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: aiReply }
          return next
        })
      }

      // Mood detection
      const isRude = /stupid|hate|shut up|idiot|wrong/i.test(content)
      const isKind = /thank|great|love|awesome|wonderful/i.test(content)
      if (isRude) updateMood(activeCharacter.id, -1)
      if (isKind) updateMood(activeCharacter.id, 1)

      // Memory extraction — every 4 messages
      if (updated.filter(m => m.role === 'user').length % 4 === 0) {
        extractMemory(updated, activeCharacter.id)
      }

    } catch (e) {
      setChatMessages([...updated, { role: 'assistant', content: '⚠️ Backend not reachable!' }])
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  const extractMemory = async (messages, characterId) => {
    try {
      const res = await fetch('http://localhost:8000/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })
      const data = await res.json()
      if (data.facts && data.facts.length > 0) {
        data.facts.forEach(fact => addMemory(characterId, fact))
      }
    } catch (e) {
      console.log('Memory extraction failed silently')
    }
  }

  const userChars = characters.filter(c => !c.isPrebuilt)
  const prebuiltChars = characters.filter(c => c.isPrebuilt)

  if (activeScene) {
    return (
      <SceneChat
        scene={activeScene}
        characters={characters}
        onClose={() => setActiveScene(null)}
        onUpdateMood={updateMood}
        onAddMemory={addMemory}
      />
    )
  }

  if (activeCharacter) {
    return (
      <div className="roleplay-chat">
        {toast && <div className="toast">{toast}</div>}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="status-dot" />
            <div>
              <div className="chat-header-title">
                {activeCharacter.emoji} {activeCharacter.name}
              </div>
              <div className="chat-header-sub">
                {getMoodLabel(activeCharacter.mood).emoji} {getMoodLabel(activeCharacter.mood).label} · Roleplay Mode
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setActiveCharacter(null)}>← Back</button>
        </div>

        <div className="messages">
          {chatMessages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">{activeCharacter.emoji}</div>
              <h1>{activeCharacter.name}</h1>
              <p>{activeCharacter.relation}</p>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'user' ? '👤' : activeCharacter.emoji}
              </div>
              <div className="message-content">
                <div className="message-label">
                  {msg.role === 'user' ? 'You' : activeCharacter.name}
                </div>
                <div className="message-bubble">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="avatar">{activeCharacter.emoji}</div>
              <div className="message-content">
                <div className="message-label">{activeCharacter.name}</div>
                <div className="message-bubble">
                  <div className="typing-indicator"><span /><span /><span /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <div className="input-area">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={`Say something to ${activeCharacter.name}...`}
              rows={1}
            />
            {(loading || streaming)
              ? <button className="send-btn stop-btn" onClick={() => { setLoading(false); setStreaming(false) }}>⏹</button>
              : <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim()}>➤</button>
            }
          </div>
          <div className="input-hint">
            {getMoodLabel(activeCharacter.mood).emoji} {activeCharacter.name} is feeling {getMoodLabel(activeCharacter.mood).label.toLowerCase()} · {activeCharacter.memory.length} memories
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="roleplay-page">
      {toast && <div className="toast">{toast}</div>}

      {showCreator && (
        <CharacterCreator
          onSave={handleSaveCharacter}
          onCancel={() => setShowCreator(false)}
        />
      )}

      {showSceneCreator && (
        <SceneCreator
          characters={characters}
          onSave={handleSaveScene}
          onCancel={() => setShowSceneCreator(false)}
        />
      )}

      <div className="roleplay-header">
        <div>
          <h1 className="roleplay-title">🎭 Roleplay</h1>
          <p className="roleplay-subtitle">Create characters, build scenes, start stories</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="new-chat-btn" onClick={() => setShowSceneCreator(true)}>🎬 New Scene</button>
          <button className="new-chat-btn" onClick={() => setShowCreator(true)}>✚ New Character</button>
        </div>
      </div>

      {/* MY CHARACTERS */}
      {userChars.length > 0 && (
        <div className="roleplay-section">
          <div className="sidebar-section-title">🎭 My Characters</div>
          <div className="characters-grid">
            {userChars.map(c => (
              <CharacterCard
                key={c.id}
                character={c}
                onChat={startChat}
                onDelete={deleteCharacter}
                onClearMemory={clearMemory}
              />
            ))}
          </div>
        </div>
      )}

      {/* PRE-BUILT CHARACTERS */}
      <div className="roleplay-section">
        <div className="sidebar-section-title">⭐ Pre-built Characters</div>
        <div className="characters-grid">
          {prebuiltChars.map(c => (
            <CharacterCard
              key={c.id}
              character={c}
              onChat={startChat}
              onDelete={deleteCharacter}
              onClearMemory={clearMemory}
            />
          ))}
        </div>
      </div>

      {/* SCENES */}
      <div className="roleplay-section">
        <div className="sidebar-section-title">🎬 My Scenes</div>
        {scenes.length === 0 ? (
          <div className="no-chats">No scenes yet. Create one with multiple characters!</div>
        ) : (
          <div className="scenes-grid">
            {scenes.map(scene => (
              <div key={scene.id} className="scene-card">
                <div className="scene-card-info">
                  <div className="scene-card-name">🎬 {scene.name}</div>
                  <div className="scene-card-chars">
                    {scene.characterIds.map(id => {
                      const c = characters.find(ch => ch.id === id)
                      return c ? <span key={id}>{c.emoji}</span> : null
                    })}
                  </div>
                  {scene.setting && <div className="scene-card-setting">{scene.setting.slice(0, 60)}...</div>}
                </div>
                <div className="scene-card-actions">
                  <button className="char-chat-btn" onClick={() => startScene(scene)}>▶ Start</button>
                  <button className="char-memory-btn" onClick={() => deleteScene(scene.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}