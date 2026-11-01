import { ref, type Ref } from 'vue'

export type CardType = 'minion' | 'spell' | 'secret' | 'weapon' | 'terrain' | 'invocation' | 'quest'
export type Rarity = 'Base' | 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface CardTexts {
  name: string
  text: string
  /** tribe / school tags, e.g. "Undead · Spirit" */
  banner?: string
}

export type RelationKind = 'summon' | 'equip' | 'transform' | 'random' | 'reward'

export interface CardRelation {
  id: string
  kind: RelationKind
}

export interface Card {
  id: string
  type: CardType
  class_primary: string
  class_secondary: string
  cost: number
  atk: number
  /** minion HP, weapon durability, terrain duration */
  hp: number
  /** souls earned by the killer when this minion dies */
  runes: number
  rarity: Rarity
  tags: string
  location: string
  location_slug: string
  image: string
  en: CardTexts
  fr: CardTexts
  /** cards this one creates (summons, equipped weapon, quest reward) */
  related?: CardRelation[]
}

export interface CardVisual {
  type: CardType | 'item'
  class_primary: string
  class_secondary: string
  cost: number
  atk: number
  hp: number
  runes: number
  rarity: Rarity
  image: string
  en: CardTexts
  fr: CardTexts
}

/** Secrets count as spells, as in game. */
export function matchesType(card: Card, type: string): boolean {
  if (type === 'spell') return card.type === 'spell' || card.type === 'secret'
  return card.type === type
}

const cards: Ref<Card[]> = ref([])
/** Non-deck cards, only shown in the zoom. */
const tokens: Ref<Card[]> = ref([])
const loading = ref(false)
const error = ref<string | null>(null)
let fetched = false

export function useCards() {
  if (!fetched) {
    fetched = true
    loading.value = true
    fetch('/data/cards.json')
      .then(r => r.json())
      .then((data: Card[]) => {
        cards.value = data
        loading.value = false
      })
      .catch((e: Error) => {
        error.value = e.message
        loading.value = false
      })
    fetch('/data/tokens.json')
      .then(r => r.json())
      .then((data: Card[]) => {
        tokens.value = data
      })
      .catch(() => {
        tokens.value = []
      })
  }
  return { cards, tokens, loading, error }
}
