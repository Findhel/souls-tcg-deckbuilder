import { ref, computed, watch } from 'vue'
import { useCards, matchesType } from './useCards'
import { useDeck } from './useDeck'

const selectedClass = ref<string | null>(null)
const selectedCost = ref<number | null>(null)
const searchQuery = ref('')
const selectedType = ref<string | null>(null)
const selectedRarity = ref<string | null>(null)
// Set by CardGrid: class of the cards currently on screen
const currentViewClass = ref<string | null>(null)

// With a deck open the class filter is locked to deck class / Neutral.
const { deckActive: deckOpen, deckClass: openDeckClass } = useDeck()
watch([deckOpen, openDeckClass], ([active, cls]) => {
  selectedClass.value = active && cls ? cls : null
})

export function useFilters() {
  const { cards } = useCards()
  const { deckActive, deckClass } = useDeck()

  const filteredCards = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return cards.value.filter(card => {
      if (deckActive.value && deckClass.value) {
        const isNeutral = card.class_primary === ''
        const matchesDeckClass =
          card.class_primary === deckClass.value || card.class_secondary === deckClass.value
        if (!isNeutral && !matchesDeckClass) return false
      }

      if (selectedClass.value !== null) {
        if (selectedClass.value === 'Neutral') {
          if (card.class_primary !== '') return false
        } else {
          const matchesPrimary = card.class_primary === selectedClass.value
          const matchesSecondary = card.class_secondary === selectedClass.value
          if (!matchesPrimary && !matchesSecondary) return false
        }
      }

      if (selectedCost.value !== null) {
        if (selectedCost.value === 10) {
          if (card.cost < 10) return false
        } else {
          if (card.cost !== selectedCost.value) return false
        }
      }

      if (selectedType.value && !matchesType(card, selectedType.value)) return false

      if (selectedRarity.value && card.rarity !== selectedRarity.value) return false

      if (q) {
        const haystack = `${card.en.name}\n${card.en.text}\n${card.fr.name}\n${card.fr.text}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })
  })

  function toggleClass(cls: string) {
    if (deckActive.value) {
      selectedClass.value = cls
      return
    }
    selectedClass.value = selectedClass.value === cls ? null : cls
  }

  function toggleCost(cost: number) {
    selectedCost.value = selectedCost.value === cost ? null : cost
  }

  function toggleType(type: string) {
    selectedType.value = selectedType.value === type ? null : type
  }

  return {
    selectedClass, selectedCost, searchQuery, selectedType, selectedRarity, filteredCards, currentViewClass,
    toggleClass, toggleCost, toggleType,
  }
}
