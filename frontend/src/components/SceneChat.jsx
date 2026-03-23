import { useState, useRef, useEffect } from 'react'
import { buildCharacterPrompt, getMoodLabel } from '../hooks/useRoleplay'

export default function SceneChat({ scene, characters, onClose, onUpdateMood, onAddMemory }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const sceneCharacters = scene.characterIds.map(id => characters.find(c => c.id === id)).filter(Boolean)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const allResponses = []

    for (const character of sceneCharacters) {
      const systemPrompt = buildCharacterPrompt(character)
      if (scene.setting) systemPrompt + `\n\nScene setting: ${scene.setting}`

      try {
        const res = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            temperature: 0.8,
            system_prompt: buildCharacterPrompt(character) + (scene.setting ? `\n\nScene: ${scene.setting}` : '')
          })
        })

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let reply = ''

        const charMsg = { role: 'assistant', character, content: '' }
        setMessages(prev => [...prev, charMsg])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          reply += decoder.decode(value)
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { ...charMsg, content: reply }
            return next
          })
        }

        // Detect mood shift from message tone
        const isRude = /stupid|hate|shut up|idiot|wrong/i.test(input)
        const isKind = /thank|great|love|awesome|wonderful/i.test(input)
        if (isRude) onUpdateMood(character.id, -1)
        if (isKind) onUpdateMood(character.id, 1)

      } catch (e) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          character,
          content: '⚠️ Could not get response.'
        }])
      }
    }

    setLoading(false)
  }

  return (
    <div className="scene-chat">
      <div className="scene-chat-header">
        <div>
          <div className="scene-chat-title">🎬 {scene.name}</div>
          <div className="scene-chat-chars">
            {sceneCharacters.map(c => (
              <span key={c.id} className="scene-char-badge">
                {c.emoji} {c.name} {getMoodLabel(c.mood).emoji}
              </span>
            ))}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h1>{scene.name}</h1>
            <p>{scene.setting || 'The scene is set. Begin the conversation!'}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
            <div className="avatar">
              {msg.role === 'user' ? '👤' : msg.character?.emoji}
            </div>
            <div className="message-content">
              <div className="message-label">
                {msg.role === 'user' ? 'You' : msg.character?.name}
              </div>
              <div className="message-bubble">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="avatar">⏳</div>
            <div className="message-content">
              <div className="message-label">Scene</div>
              <div className="message-bubble">
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-wrapper">
        <div className="input-area">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Speak to the scene..."
            rows={1}
          />
          <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>➤</button>
        </div>
      </div>
    </div>
  )
}
