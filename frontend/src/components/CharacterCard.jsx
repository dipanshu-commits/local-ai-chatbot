import { getMoodLabel } from '../hooks/useRoleplay'

export default function CharacterCard({ character, onChat, onDelete, onClearMemory }) {
  const mood = getMoodLabel(character.mood)

  return (
    <div className="character-card">
      <div className="character-card-header">
        <div className="character-avatar">{character.emoji}</div>
        <div className="character-info">
          <div className="character-name">{character.name}</div>
          <div className="character-mood">{mood.emoji} {mood.label}</div>
        </div>
        {!character.isPrebuilt && (
          <button className="char-delete-btn" onClick={() => onDelete(character.id)}>🗑️</button>
        )}
      </div>

      <div className="character-personality">{character.personality.slice(0, 80)}...</div>

      <div className="character-meta">
        <span className="char-tag">{character.tone}</span>
        {character.memory.length > 0 && (
          <span className="char-tag memory-tag">🧠 {character.memory.length} memories</span>
        )}
      </div>

      <div className="character-actions">
        <button className="char-chat-btn" onClick={() => onChat(character)}>
          💬 Start Roleplay
        </button>
        {character.memory.length > 0 && (
          <button className="char-memory-btn" onClick={() => onClearMemory(character.id)}>
            🗑️ Clear Memory
          </button>
        )}
      </div>
    </div>
  )
}