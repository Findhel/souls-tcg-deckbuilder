import { ref, computed } from 'vue'
import type { Card } from './useCards'
import type { Hero } from '@/data/heroes'
import type { SavedDeck } from './useDeckStorage'
import { MAX_DECK_ITEMS } from './useItems'

export interface DeckEntry {
  card: Card
  count: number
}

export const DECK_SIZE = 30

const hero = ref<Hero | null>(null)
const deckCards = ref<DeckEntry[]>([])
const deckItems = ref<string[]>([])
const deckActive = ref(false)
const deckClass = ref<string | null>(null)
const deckName = ref<string>('')
const activeDeckId = ref<string | null>(null)

const totalCount = computed(() => deckCards.value.reduce((sum, e) => sum + e.count, 0))

function openNewDeck(cls: string, name: string): void {
  deckCards.value = []
  deckItems.value = []
  hero.value = null
  deckClass.value = cls
  deckName.value = name
  activeDeckId.value = null
  deckActive.value = true
}

type DeckContents = Omit<SavedDeck, 'id' | 'updatedAt'> & { id?: string }

/** Without an id (starter deck, shared link) the deck is new: saving creates a copy. */
function loadSavedDeck(saved: DeckContents, allCards: Card[], allHeroes: Hero[]): void {
  deckClass.value = saved.deckClass
  deckName.value = saved.name
  activeDeckId.value = saved.id ?? null
  hero.value = saved.heroId ? (allHeroes.find(h => h.id === saved.heroId) ?? null) : null
  const cardMap = new Map(allCards.map(c => [c.id, c]))
  deckCards.value = saved.cards
    .map(({ id, count }) => {
      const card = cardMap.get(id)
      return card ? { card, count } : null
    })
    .filter((e): e is DeckEntry => e !== null)
  deckItems.value = (saved.items ?? []).slice(0, MAX_DECK_ITEMS)
  deckActive.value = true
}

function closeDeck(): void {
  deckActive.value = false
  deckClass.value = null
  deckCards.value = []
  deckItems.value = []
  hero.value = null
  deckName.value = ''
  activeDeckId.value = null
}

function setHero(h: Hero | null): void {
  hero.value = h
}

export function maxCopies(card: Card): number {
  return card.rarity === 'Legendary' ? 1 : 2
}

function canAddCard(card: Card): boolean {
  if (!deckActive.value || totalCount.value >= DECK_SIZE) return false
  if (getCount(card.id) >= maxCopies(card)) return false
  return card.type !== 'quest' || !deckCards.value.some(e => e.card.type === 'quest')
}

function addCard(card: Card): void {
  if (!canAddCard(card)) return
  const entry = deckCards.value.find(e => e.card.id === card.id)
  if (entry) entry.count++
  else deckCards.value.push({ card, count: 1 })
}

function removeCard(cardId: string): void {
  const idx = deckCards.value.findIndex(e => e.card.id === cardId)
  if (idx === -1) return
  const entry = deckCards.value[idx]
  if (!entry) return
  if (entry.count > 1) {
    entry.count--
  } else {
    deckCards.value.splice(idx, 1)
  }
}

function getCount(cardId: string): number {
  return deckCards.value.find(e => e.card.id === cardId)?.count ?? 0
}

function toggleItem(itemId: string): void {
  const idx = deckItems.value.indexOf(itemId)
  if (idx >= 0) deckItems.value.splice(idx, 1)
  else if (deckItems.value.length < MAX_DECK_ITEMS) deckItems.value.push(itemId)
}

export function useDeck() {
  return {
    hero, cards: deckCards, items: deckItems, totalCount, deckActive, deckClass, deckName, activeDeckId,
    openNewDeck, loadSavedDeck, closeDeck, setHero, canAddCard, addCard, removeCard, getCount, toggleItem,
  }
}
