import heroData from './heroes.json'
import type { CardTexts } from '@/composables/useCards'

export interface HeroPower {
  cost: number
  icon: string
  en: CardTexts
  fr: CardTexts
}

export interface Hero {
  id: string
  class: string
  hp: number
  en: { name: string }
  fr: { name: string }
  portrait: string
  power: HeroPower
}

export const heroes: Hero[] = heroData
