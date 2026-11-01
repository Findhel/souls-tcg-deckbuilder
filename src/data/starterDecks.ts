import deckData from './starter-decks.json'

// Per class: the starter deck and the adventure deck of the reward hero.
export type StarterDeckKind = 'starter' | 'adventure'

export interface StarterDeck {
  id: string
  kind: StarterDeckKind
  class: string
  /** not shown: decks are named after their hero */
  title: string
  hero: string
  cards: { id: string; count: number }[]
  items: string[]
}

export const starterDecks = deckData as StarterDeck[]
