import { MAX_DECK_ITEMS } from './useItems'

// Also decoded by the Unity game (DeckUrlCodec.cs): keep the format stable.
interface UrlDeckPayload {
  v: 1
  n: string
  c: string
  h: string | null
  l: [string, number][]
  /** omitted when the deck has no items, so older links stay identical */
  i?: string[]
}

export interface DecodedDeck {
  name: string
  deckClass: string
  heroId: string | null
  cards: { id: string; count: number }[]
  items: string[]
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeDeck(deck: DecodedDeck): string {
  const payload: UrlDeckPayload = {
    v: 1,
    n: deck.name,
    c: deck.deckClass,
    h: deck.heroId,
    l: deck.cards.map(({ id, count }) => [id, count]),
  }
  if (deck.items.length > 0) payload.i = deck.items
  return toBase64(JSON.stringify(payload))
}

const MAX_ENCODED_LENGTH = 8192
const MAX_STRING_LENGTH = 64
const MAX_CARD_LINES = 60
const MAX_COPIES = 2

const isId = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= MAX_STRING_LENGTH

/** Untrusted input: validate shape and bounds. Unknown ids are dropped by loadSavedDeck. */
export function decodeDeck(encoded: string): DecodedDeck | null {
  if (encoded.length > MAX_ENCODED_LENGTH) return null
  try {
    const payload: unknown = JSON.parse(fromBase64(encoded))
    if (typeof payload !== 'object' || payload === null) return null
    const { v, n, c, h, l, i } = payload as Record<string, unknown>
    if (v !== 1 || !isId(c) || typeof n !== 'string' || !n || !Array.isArray(l)) return null
    if (h != null && !isId(h)) return null
    const cards: DecodedDeck['cards'] = []
    for (const line of l.slice(0, MAX_CARD_LINES)) {
      if (!Array.isArray(line)) return null
      const [id, count] = line
      if (!isId(id) || !Number.isInteger(count) || count < 1) return null
      cards.push({ id, count: Math.min(count, MAX_COPIES) })
    }
    return {
      name: n.slice(0, MAX_STRING_LENGTH),
      deckClass: c,
      heroId: h ?? null,
      cards,
      items: Array.isArray(i) ? i.filter(isId).slice(0, MAX_DECK_ITEMS) : [],
    }
  } catch {
    return null
  }
}

export function buildShareUrl(deck: DecodedDeck): string {
  const encoded = encodeDeck(deck)
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('deck', encoded)
  return url.toString()
}

export function clearDeckParam(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('deck')
  window.history.replaceState({}, '', url.toString())
}
