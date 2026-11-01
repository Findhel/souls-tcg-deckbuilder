import { ref } from 'vue'

export interface SavedDeck {
  id: string
  name: string
  deckClass: string
  heroId: string | null
  cards: { id: string; count: number }[]
  /** absent on decks saved before items existed */
  items?: string[]
  updatedAt: number
}

const STORAGE_KEY = 'souls-tcg-decks'

function loadFromStorage(): SavedDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedDeck[]) : []
  } catch {
    return []
  }
}

const savedDecks = ref<SavedDeck[]>(loadFromStorage())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDecks.value))
}

function saveDeck(
  deckClass: string,
  heroId: string | null,
  cards: { id: string; count: number }[],
  items: string[],
  name: string,
  existingId?: string,
): SavedDeck {
  const id = existingId ?? crypto.randomUUID()
  const deck: SavedDeck = { id, name, deckClass, heroId, cards, items, updatedAt: Date.now() }
  const idx = savedDecks.value.findIndex(d => d.id === id)
  if (idx >= 0) {
    savedDecks.value[idx] = deck
  } else {
    savedDecks.value.push(deck)
  }
  persist()
  return deck
}

function deleteDeck(id: string) {
  savedDecks.value = savedDecks.value.filter(d => d.id !== id)
  persist()
}

export function useDeckStorage() {
  return { savedDecks, saveDeck, deleteDeck }
}
