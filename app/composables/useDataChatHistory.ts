/**
 * Persist datanalyst chat conversations to localStorage.
 *
 * Conversations are scoped to the /data page (datanalyst agent) and survive
 * page reloads. Each conversation tracks: id, title (auto from first message),
 * game, messages[], timestamps.
 */
import type { ChatMessage } from '~/types'

export interface DataConversation {
  id: string
  title: string
  game: 'president' | 'pusoy'
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'datanalyst-conversations'
const MAX_CONVERSATIONS = 50

export function useDataChatHistory() {
  const conversations = useState<DataConversation[]>('datanalyst-conversations', () => [])
  const activeId = useState<string | null>('datanalyst-active-conv', () => null)
  const isLoaded = useState<boolean>('datanalyst-history-loaded', () => false)

  function loadFromStorage() {
    if (isLoaded.value || typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        conversations.value = JSON.parse(raw)
      }
    } catch (e) {
      console.warn('[chat-history] load failed', e)
    }
    isLoaded.value = true
  }

  function saveToStorage() {
    if (typeof localStorage === 'undefined') return
    try {
      // Keep only MAX_CONVERSATIONS most recent
      const trimmed = [...conversations.value]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_CONVERSATIONS)
      conversations.value = trimmed
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch (e) {
      console.warn('[chat-history] save failed', e)
    }
  }

  function newConversation(game: 'president' | 'pusoy'): DataConversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const conv: DataConversation = {
      id,
      title: 'New conversation',
      game,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    conversations.value.unshift(conv)
    activeId.value = id
    saveToStorage()
    return conv
  }

  function upsertActive(messages: ChatMessage[], game: 'president' | 'pusoy') {
    if (!activeId.value) return
    const idx = conversations.value.findIndex(c => c.id === activeId.value)
    if (idx === -1) return
    const existing = conversations.value[idx]!
    // Auto-title from first user message
    let title = existing.title
    if (title === 'New conversation') {
      const firstUser = messages.find(m => m.role === 'user')
      if (firstUser) {
        const stripped = firstUser.content.replace(/^\[Game:[^\]]+\]\s*\n*/g, '').trim()
        title = stripped.slice(0, 60) + (stripped.length > 60 ? '…' : '')
      }
    }
    conversations.value[idx] = {
      ...existing,
      title,
      game,
      messages: [...messages],
      updatedAt: Date.now(),
    }
    saveToStorage()
  }

  function loadConversation(id: string): DataConversation | null {
    const conv = conversations.value.find(c => c.id === id)
    if (!conv) return null
    activeId.value = id
    return conv
  }

  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter(c => c.id !== id)
    if (activeId.value === id) activeId.value = null
    saveToStorage()
  }

  function renameConversation(id: string, title: string) {
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      conversations.value[idx] = { ...conversations.value[idx]!, title, updatedAt: Date.now() }
      saveToStorage()
    }
  }

  return {
    conversations,
    activeId,
    isLoaded,
    loadFromStorage,
    newConversation,
    upsertActive,
    loadConversation,
    deleteConversation,
    renameConversation,
  }
}
