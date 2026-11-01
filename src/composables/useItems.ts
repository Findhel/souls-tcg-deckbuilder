import { ref, type Ref } from 'vue'
import type { CardTexts, CardRelation, CardVisual, Rarity } from './useCards'

export const MAX_DECK_ITEMS = 3

export interface Item {
  id: string
  /** in souls */
  price: number
  rarity: Rarity
  image: string
  en: CardTexts
  fr: CardTexts
  related?: CardRelation[]
}

export function itemVisual(item: Item): CardVisual {
  return {
    type: 'item',
    class_primary: '',
    class_secondary: '',
    cost: 0,
    atk: 0,
    hp: 0,
    runes: 0,
    rarity: item.rarity,
    image: item.image,
    en: item.en,
    fr: item.fr,
  }
}

const items: Ref<Item[]> = ref([])
let fetched = false

export function useItems() {
  if (!fetched) {
    fetched = true
    fetch('/data/items.json')
      .then(r => r.json())
      .then((data: Item[]) => {
        items.value = data
      })
      .catch(() => {
        items.value = []
      })
  }
  return { items }
}
