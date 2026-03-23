import { useState } from 'react'

export default function SceneCreator({ characters, onSave, onCancel }) {
  const [name, setName] = useState('')
  const [setting, setSetting] = useState('')
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')

  const toggleCharacter = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const handleSave = () => {
    if (!name.trim()) return setError('Scene name is required!')
    if (selected.length < 2) return setError('Select at least 2 characters!')
    setError('')
    onSave({ name, setting, characterIds: selected })
  }

  return (
    <div className="creator-overlay">
      <div className="creator-modal">
        <div className="creator-header">
          <h2>🎬 Create Scene</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="creator-body">
          <div className="creator-field">
            <label>Scene Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="creator-input"
              placeholder="e.g. Space Station 2087..."
            />
          </div>

          <div className="creator-field">
            <label>Setting / Context</label>
            <textarea
              value={setting}
              onChange={e => setSetting(e.target.value)}
              className="creator-textarea"
              placeholder="Describe the situation and setting for this scene..."
              rows={3}
            />
          </div>

          <div className="creator-field">
            <label>Select Characters (2-5) *</label>
            <div className="scene-character-grid">
              {characters.map(c => (
                <div
                  key={c.id}
                  className={`scene-char-option ${selected.includes(c.id) ? 'selected' : ''}`}
                  onClick={() => toggleCharacter(c.id)}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                  {selected.includes(c.id) && <span className="check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="creator-error">⚠️ {error}</div>}
        </div>

        <div className="creator-footer">
          <button className="creator-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="creator-save-btn" onClick={handleSave}>✓ Create Scene</button>
        </div>
      </div>
    </div>
  )
}
