import { useState } from 'react'

const defaultForm = {
  name: '',
  emoji: '🎭',
  personality: '',
  lore: '',
  situation: '',
  relation: '',
  tone: 'casual',
}

export default function CharacterCreator({ onSave, onCancel }) {
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = () => {
    if (!form.name.trim()) return setError('Name is required!')
    if (!form.personality.trim()) return setError('Personality is required!')
    if (!form.lore.trim()) return setError('Lore is required!')
    setError('')
    onSave(form)
  }

  return (
    <div className="creator-overlay">
      <div className="creator-modal">
        <div className="creator-header">
          <h2>🎭 Create Character</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="creator-body">
          <div className="creator-row">
            <div className="creator-field" style={{ flex: '0 0 80px' }}>
              <label>Emoji</label>
              <input
                type="text"
                value={form.emoji}
                onChange={e => update('emoji', e.target.value)}
                className="creator-input emoji-input"
                maxLength={2}
              />
            </div>
            <div className="creator-field" style={{ flex: 1 }}>
              <label>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="creator-input"
                placeholder="Character name..."
              />
            </div>
          </div>

          <div className="creator-field">
            <label>Personality *</label>
            <textarea
              value={form.personality}
              onChange={e => update('personality', e.target.value)}
              className="creator-textarea"
              placeholder="Describe how they think, speak and behave..."
              rows={3}
            />
          </div>

          <div className="creator-field">
            <label>Lore / Background *</label>
            <textarea
              value={form.lore}
              onChange={e => update('lore', e.target.value)}
              className="creator-textarea"
              placeholder="Who are they? Where did they come from?"
              rows={3}
            />
          </div>

          <div className="creator-field">
            <label>Current Situation</label>
            <textarea
              value={form.situation}
              onChange={e => update('situation', e.target.value)}
              className="creator-textarea"
              placeholder="What is happening in their life right now?"
              rows={2}
            />
          </div>

          <div className="creator-field">
            <label>Relation to You</label>
            <input
              type="text"
              value={form.relation}
              onChange={e => update('relation', e.target.value)}
              className="creator-input"
              placeholder="Old friend, rival, mentor, stranger..."
            />
          </div>

          <div className="creator-field">
            <label>Tone</label>
            <div className="toggle-group">
              {['casual', 'neutral', 'formal'].map(t => (
                <button
                  key={t}
                  className={`toggle-btn ${form.tone === t ? 'active' : ''}`}
                  onClick={() => update('tone', t)}
                >
                  {t === 'casual' ? '😄' : t === 'neutral' ? '🤝' : '🎩'} {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="creator-error">⚠️ {error}</div>}
        </div>

        <div className="creator-footer">
          <button className="creator-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="creator-save-btn" onClick={handleSave}>✓ Save Character</button>
        </div>
      </div>
    </div>
  )
}
