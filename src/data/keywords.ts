import type { Lang } from '@/composables/useLang'

// `match` is case-sensitive (keywords are capitalized in card texts), whole words only.

interface KeywordText {
  name: string
  desc: string
  match: string
}

export interface Keyword {
  id: string
  en: KeywordText
  fr: KeywordText
}

export const keywords: Keyword[] = [
  {
    id: 'quest',
    en: {
      name: 'Quest',
      match: 'Quest',
      desc: 'Always in your opening hand; one per deck. Once played it sits in your quest slot, visible to both players. Complete both steps to get the reward card in hand.',
    },
    fr: {
      name: 'Quête',
      match: 'Quête',
      desc: 'Toujours dans votre main de départ ; une par deck. Une fois jouée, elle s\'installe dans votre emplacement de quête, visible des deux joueurs. Accomplissez ses deux étapes pour recevoir la carte récompense en main.',
    },
  },
  {
    id: 'battlecry',
    en: { name: 'Battlecry', match: 'Battlecry', desc: 'Triggers when you play this card from your hand.' },
    fr: { name: 'Cri de guerre', match: 'Cri de guerre', desc: 'Se déclenche quand vous jouez cette carte depuis votre main.' },
  },
  {
    id: 'deathrattle',
    en: { name: 'Deathrattle', match: 'Deathrattle', desc: 'Triggers when this minion dies.' },
    fr: { name: 'Mort', match: 'Mort\\s*:', desc: 'Se déclenche quand ce serviteur meurt.' },
  },
  {
    id: 'combo',
    en: { name: 'Combo', match: 'Combo', desc: 'Bonus effect if you already played another card this turn.' },
    fr: { name: 'Combo', match: 'Combo', desc: 'Effet bonus si vous avez déjà joué une autre carte ce tour.' },
  },
  {
    id: 'spellburst',
    en: { name: 'Spellburst', match: 'Spellburst', desc: 'Triggers each time you cast a spell (Invocations don\'t count).' },
    fr: { name: 'Salve', match: 'Salve', desc: 'Se déclenche chaque fois que vous lancez un sort (les Invocations ne comptent pas).' },
  },
  {
    id: 'overkill',
    en: { name: 'Overkill', match: 'Overkill', desc: 'Triggers when this kills a minion with excess damage.' },
    fr: { name: 'Brutalité', match: 'Brutalité', desc: 'Se déclenche quand il tue un serviteur avec des dégâts en excès.' },
  },
  {
    id: 'enrage',
    en: { name: 'Enrage', match: 'Enrage', desc: 'Triggers the first time this minion survives damage.' },
    fr: { name: 'Rage', match: 'Rage', desc: 'Se déclenche la première fois que ce serviteur survit à des dégâts.' },
  },
  {
    id: 'overheal',
    en: { name: 'Overheal', match: 'Overheal', desc: 'Triggers when a friendly character is healed above its maximum Health.' },
    fr: { name: 'Surplus de soins', match: 'Surplus de soins', desc: 'Se déclenche quand un personnage allié est soigné au-delà de ses PV max.' },
  },
  {
    id: 'mana-thirst',
    en: { name: 'Mana Thirst', match: 'Mana Thirst', desc: 'Stronger effect if you have at least that many mana crystals.' },
    fr: { name: 'Soif de mana', match: 'Soif de mana', desc: "Effet renforcé si vous avez au moins autant de cristaux de mana." },
  },
  {
    id: 'choose-one',
    en: { name: 'Choose One', match: 'Choose One', desc: 'Pick one of the effects when you play this card.' },
    fr: { name: 'Choix', match: 'Choix', desc: "Choisissez l'un des effets quand vous jouez cette carte." },
  },
  {
    id: 'secret',
    en: { name: 'Secret', match: 'Secret', desc: 'Hidden from your opponent until its condition is met, then triggers.' },
    fr: { name: 'Secret', match: 'Secret', desc: "Caché à l'adversaire jusqu'à ce que sa condition soit remplie, puis se déclenche." },
  },
  {
    id: 'taunt',
    en: { name: 'Taunt', match: 'Taunt', desc: 'Enemies must attack this minion first. Spells ignore it.' },
    fr: { name: 'Provocation', match: 'Provocation', desc: 'Les ennemis doivent attaquer ce serviteur en premier. Les sorts l\'ignorent.' },
  },
  {
    id: 'rush',
    en: { name: 'Rush', match: 'Rush', desc: 'Can attack minions the turn it is played.' },
    fr: { name: 'Ruée', match: 'Ruée', desc: 'Peut attaquer des serviteurs dès le tour où il est joué.' },
  },
  {
    id: 'charge',
    en: { name: 'Charge', match: 'Charge', desc: 'Can attack anything, heroes included, the turn it is played.' },
    fr: { name: 'Charge', match: 'Charge', desc: 'Peut attaquer n\'importe quoi, héros compris, dès le tour où il est joué.' },
  },
  {
    id: 'fury',
    en: { name: 'Fury', match: 'Fury', desc: 'Can attack twice each turn.' },
    fr: { name: 'Furie', match: 'Furie', desc: 'Peut attaquer deux fois par tour.' },
  },
  {
    id: 'stealth',
    en: { name: 'Stealth', match: 'Stealth', desc: "Can't be attacked or targeted by the enemy until it attacks." },
    fr: { name: 'Camouflage', match: 'Camouflage', desc: "Ne peut pas être attaqué ni ciblé par l'ennemi tant qu'il n'a pas attaqué." },
  },
  {
    id: 'divine-shield',
    en: { name: 'Divine Shield', match: 'Divine Shield', desc: 'The first damage this minion takes is ignored.' },
    fr: { name: 'Bouclier divin', match: 'Bouclier divin', desc: 'Les premiers dégâts subis par ce serviteur sont ignorés.' },
  },
  {
    id: 'reborn',
    en: { name: 'Reborn', match: 'Reborn', desc: 'The first time it dies, it comes back with 1 Health.' },
    fr: { name: 'Réincarnation', match: 'Réincarnation', desc: 'La première fois qu\'il meurt, il revient avec 1 PV.' },
  },
  {
    id: 'cleave',
    en: { name: 'Cleave', match: 'Cleave', desc: "When it attacks a minion, it also hits the minions adjacent to its target." },
    fr: { name: 'Balayage', match: 'Balayage', desc: 'Quand il attaque un serviteur, il frappe aussi les serviteurs adjacents à sa cible.' },
  },
  {
    id: 'immune',
    en: { name: 'Immune', match: 'Immune', desc: "Can't take damage." },
    fr: { name: 'Insensible', match: 'Insensible(?! aux sorts)', desc: 'Ne peut pas subir de dégâts.' },
  },
  {
    id: 'spell-immunity',
    en: { name: 'Spell Immunity', match: 'Spell Immunity', desc: "Can't be targeted by spells." },
    fr: { name: 'Insensible aux sorts', match: 'Insensible aux sorts', desc: 'Ne peut pas être ciblé par les sorts.' },
  },
  {
    id: 'spell-damage',
    en: { name: 'Spell Damage', match: 'Spell Damage', desc: 'Your spells deal that much extra damage.' },
    fr: { name: 'Dégâts des sorts', match: 'Dégâts des sorts', desc: "Vos sorts infligent autant de dégâts supplémentaires." },
  },
  {
    id: 'burn',
    en: { name: 'Burn', match: 'Burns?', desc: 'X = number of ticks. At the start of its owner\'s turn, deals 1 damage, then loses 1 Burn. Stacks.' },
    fr: { name: 'Brûlure', match: 'Brûlures?', desc: 'X = nombre de tics. Au début du tour de son propriétaire, inflige 1 dégât puis perd 1 Brûlure. Cumulable.' },
  },
  {
    id: 'hemorrhage',
    en: { name: 'Hemorrhage', match: 'Hemorrhage', desc: 'Stacks on any target. The next time it takes direct damage (combat or spell), all stacks are dealt as bonus damage, then reset.' },
    fr: { name: 'Hémorragie', match: 'Hémorragie', desc: 'Se cumule sur toute cible. La prochaine fois qu\'elle subit des dégâts directs (combat ou sort), toutes les charges sont infligées en bonus, puis remises à zéro.' },
  },
  {
    id: 'poison',
    en: { name: 'Poison', match: 'Poison', desc: 'Permanently lowers the Attack and Health of the minion by X.' },
    fr: { name: 'Poison', match: 'Poison', desc: "Réduit définitivement l'ATQ et les PV du serviteur de X." },
  },
  {
    id: 'freeze',
    en: { name: 'Freeze', match: 'Freeze|Frozen', desc: 'A Frozen character skips its next attack.' },
    fr: { name: 'Gel', match: '[Gg]èlent|[Gg]èle|Gelé(?:e|s|es)?|Gel', desc: 'Un personnage gelé passe sa prochaine attaque.' },
  },
  {
    id: 'silence',
    en: { name: 'Silence', match: 'Silence', desc: 'Removes all abilities and keywords from a minion.' },
    fr: { name: 'Silence', match: '[Rr]éduit au silence|[Rr]éduisez au silence', desc: "Retire toutes les capacités et mots-clés d'un serviteur." },
  },
  {
    id: 'discover',
    en: { name: 'Discover', match: 'Discover', desc: 'Choose one of three cards to add to your hand.' },
    fr: { name: 'Découvrir', match: 'Découvrez|Découvre', desc: 'Choisissez une carte parmi trois à ajouter à votre main.' },
  },
]

const patterns = new Map<string, RegExp>()

function pattern(kw: Keyword, lang: Lang): RegExp {
  const key = `${kw.id}:${lang}`
  let re = patterns.get(key)
  if (!re) {
    // \b doesn't handle accented letters
    re = new RegExp(`(?<!\\p{L})(?:${kw[lang].match})(?!\\p{L})`, 'u')
    patterns.set(key, re)
  }
  return re
}

export function keywordsIn(text: string, lang: Lang): KeywordText[] {
  return keywords
    .map(kw => ({ kw, at: text.search(pattern(kw, lang)) }))
    .filter(m => m.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(m => m.kw[lang])
}
