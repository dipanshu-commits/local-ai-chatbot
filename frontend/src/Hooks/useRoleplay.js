import { useState, useEffect } from 'react'
import prebuiltCharacters from '../data/prebuiltCharacters'

const CHARACTERS_KEY = 'localai_characters'
const SCENES_KEY = 'localai_scenes'

function loadCharacters() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHARACTERS_KEY)) || []
    // Always merge prebuilts (by id) with user characters
    const userChars = saved.filter(c => !c.isPrebuilt)
    return [...prebuiltCharacters, ...userChars]
  } catch { return prebuiltCharacters }
}

function loadScenes() {
  try { return JSON.parse(localStorage.getItem(SCENES_KEY)) || [] }
  catch { return [] }
}

function saveUserCharacters(characters) {
  const userOnly = characters.filter(c => !c.isPrebuilt)
  localStorage.setItem(CHARACTERS_KEY, JSON.stringify(userOnly))
}

function saveScenes(scenes) {
  localStorage.setItem(SCENES_KEY, JSON.stringify(scenes))
}

// Mood label helper
export function getMoodLabel(mood) {
  if (mood >= 2)  return { emoji: '😄', label: 'Very Happy' }
  if (mood === 1) return { emoji: '🙂', label: 'Friendly' }
  if (mood === 0) return { emoji: '😐', label: 'Neutral' }
  if (mood === -1) return { emoji: '😒', label: 'Cold' }
  return { emoji: '😠', label: 'Hostile' }
}

// Build system prompt from character
export function buildCharacterPrompt(character) {
  const mood = getMoodLabel(character.mood)
  const memoryText = character.memory.length > 0
    ? `\n\nThings you remember about the user:\n${character.memory.map(m => `- ${m}`).join('\n')}`
    : ''

  const toneMap = {
    casual: 'Speak casually and naturally.',
    formal: 'Speak formally and with gravitas.',
    neutral: 'Speak naturally, adapting to the conversation.'
  }

  const moodMap = {
    2:  'You are in a very good mood. Warm, enthusiastic, open.',
    1:  'You are in a friendly mood. Approachable and positive.',
    0:  'You are in a neutral mood. Neither warm nor cold.',
    '-1': 'You are in a cold mood. Distant, short responses, guarded.',
    '-2': 'You are in a hostile mood. Defensive, sharp, unwilling to engage deeply.'
  }

  return `You are ${character.name}. ${character.personality}

Background: ${character.lore}
Current situation: ${character.situation}
Your relationship with the user: ${character.relation}

${toneMap[character.tone] || toneMap.neutral}
${moodMap[character.mood] || moodMap[0]}

Stay completely in character at all times. Never break character or admit you are an AI.${memoryText}`
}

export function useRoleplay() {
  const [characters, setCharacters] = useState(loadCharacters)
  const [scenes, setScenes]         = useState(loadScenes)

  const createCharacter = (data) => {
    const newChar = {
      ...data,
      id: `char_${Date.now()}`,
      mood: 0,
      memory: [],
      isPrebuilt: false,
      createdAt: Date.now()
    }
    const updated = [...characters, newChar]
    setCharacters(updated)
    saveUserCharacters(updated)
    return newChar
  }

  const updateCharacter = (id, updates) => {
    const updated = characters.map(c => c.id === id ? { ...c, ...updates } : c)
    setCharacters(updated)
    saveUserCharacters(updated)
  }

  const deleteCharacter = (id) => {
    const updated = characters.filter(c => c.id !== id)
    setCharacters(updated)
    saveUserCharacters(updated)
  }

  const updateMood = (id, delta) => {
    const updated = characters.map(c => {
      if (c.id !== id) return c
      const newMood = Math.max(-2, Math.min(2, c.mood + delta))
      return { ...c, mood: newMood }
    })
    setCharacters(updated)
    saveUserCharacters(updated)
  }

  const addMemory = (id, fact) => {
    const updated = characters.map(c => {
      if (c.id !== id) return c
      const memory = [...c.memory, fact].slice(-20) // keep last 20 facts
      return { ...c, memory }
    })
    setCharacters(updated)
    saveUserCharacters(updated)
  }

  const clearMemory = (id) => {
    updateCharacter(id, { memory: [] })
  }

  const createScene = (data) => {
    const newScene = {
      ...data,
      id: `scene_${Date.now()}`,
      createdAt: Date.now()
    }
    const updated = [...scenes, newScene]
    setScenes(updated)
    saveScenes(updated)
    return newScene
  }

  const deleteScene = (id) => {
    const updated = scenes.filter(s => s.id !== id)
    setScenes(updated)
    saveScenes(updated)
  }

  return {
    characters,
    scenes,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    updateMood,
    addMemory,
    clearMemory,
    createScene,
    deleteScene,
  }
}

