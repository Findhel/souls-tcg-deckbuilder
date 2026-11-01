<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useCards } from '@/composables/useCards'
import type { Card } from '@/composables/useCards'
import { useFilters } from '@/composables/useFilters'
import { useDeck } from '@/composables/useDeck'
import { useLang } from '@/composables/useLang'
import { useLayout } from '@/composables/useLayout'
import { classes } from '@/data/classes'
import CardComponent from '@/components/Card.vue'

const { loading } = useCards()
const { filteredCards, currentViewClass, selectedClass } = useFilters()
const { addCard, getCount, deckActive } = useDeck()
const { lang, t } = useLang()
const { isShort, zoomedCard } = useLayout()

const BASE_W = 250
const BASE_H = 350
const MAX_SCALE = 1.28
const MIN_TWO_ROW_SCALE = 0.5 // below that, one bigger row reads better than two tiny ones
const MIN_SCALE = 0.36
const ROW_GAP = 56
const NARROW_W = 480 // tighter gutters on portrait phones

// '' = Neutral, always last
const CLASS_ORDER = [...classes.map(c => c.id), '']

const gridContainer = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const currentPage = ref(0)

const padTop = computed(() => (isShort.value ? 12 : 40))
const padBottom = computed(() => (isShort.value ? 30 : 44))
const narrow = computed(() => containerWidth.value > 0 && containerWidth.value < NARROW_W)
const GAP = computed(() => (narrow.value ? 8 : 12))
const H_PADDING = computed(() => (narrow.value ? 16 : 32))
const rowsHeight = computed(() => containerHeight.value - padTop.value - padBottom.value)

const rows = computed(() => ((rowsHeight.value - ROW_GAP) / (2 * BASE_H) >= MIN_TWO_ROW_SCALE ? 2 : 1))

const scale = computed(() => {
  if (containerHeight.value <= 0) return MAX_SCALE
  const byHeight = (rowsHeight.value - (rows.value - 1) * ROW_GAP) / (rows.value * BASE_H)
  const byWidth =
    containerWidth.value > 0 ? (containerWidth.value - H_PADDING.value - GAP.value) / (2 * BASE_W) : MAX_SCALE
  const fit = Math.max(MIN_SCALE, Math.min(MAX_SCALE, byHeight, byWidth))
  // Floored: rounding up by half a pixel made two exactly-fitting columns overflow
  return Math.floor(BASE_W * fit) / BASE_W
})
const cardW = computed(() => BASE_W * scale.value)
const cardH = computed(() => Math.floor(BASE_H * scale.value))

const visibleCols = computed(() =>
  Math.max(1, Math.floor((containerWidth.value - H_PADDING.value + GAP.value + 0.01) / (cardW.value + GAP.value)))
)
const cardsPerPage = computed(() => visibleCols.value * rows.value)

// sectionOf: class section of each slot (dual-class cards appear in two sections)
const layout = computed((): { cards: (Card | null)[]; sectionOf: string[] } => {
  if (cardsPerPage.value === 0) return { cards: [], sectionOf: [] }

  const cards: (Card | null)[] = []
  const sectionOf: string[] = []

  const l = lang.value
  const byName = (a: Card, b: Card) => a.cost - b.cost || a[l].name.localeCompare(b[l].name)
  const pushGroup = (cls: string, group: Card[]) => {
    const label = cls === '' ? 'Neutral' : cls
    for (const c of [...group].sort(byName)) { cards.push(c); sectionOf.push(label) }
    const remainder = group.length % cardsPerPage.value
    if (remainder !== 0)
      for (let i = 0; i < cardsPerPage.value - remainder; i++) { cards.push(null); sectionOf.push(label) }
  }

  if (selectedClass.value !== null) {
    const classCards = filteredCards.value.filter(c => c.class_primary !== '')
    const neutralCards = filteredCards.value.filter(c => c.class_primary === '')
    if (classCards.length > 0) pushGroup(selectedClass.value, classCards)
    if (neutralCards.length > 0) pushGroup('', neutralCards)
    return { cards, sectionOf }
  }

  const groups = new Map<string, Card[]>()
  const addToGroup = (cls: string, card: Card) => {
    if (!groups.has(cls)) groups.set(cls, [])
    groups.get(cls)!.push(card)
  }
  for (const card of filteredCards.value) {
    addToGroup(card.class_primary, card)
    if (card.class_secondary) addToGroup(card.class_secondary, card)
  }
  for (const cls of CLASS_ORDER) {
    const group = groups.get(cls)
    if (!group || group.length === 0) continue
    pushGroup(cls, group)
  }
  return { cards, sectionOf }
})

const groupedAndPadded = computed(() => layout.value.cards)

const totalPages = computed(() =>
  cardsPerPage.value === 0 ? 1 : Math.max(1, groupedAndPadded.value.length / cardsPerPage.value)
)
const pageCards = computed(() => {
  const start = currentPage.value * cardsPerPage.value
  return groupedAndPadded.value.slice(start, start + cardsPerPage.value)
})

// Keep the first visible card on screen when the cards-per-page count changes
let anchor: { id: string; section: string } | null = null

function goToPage(page: number) {
  currentPage.value = Math.max(0, Math.min(totalPages.value - 1, page))
  const start = currentPage.value * cardsPerPage.value
  const card = layout.value.cards[start]
  anchor = card ? { id: card.id, section: layout.value.sectionOf[start] ?? '' } : null
}

watch(filteredCards, () => goToPage(0))
watch(cardsPerPage, () => {
  const { cards, sectionOf } = layout.value
  const a = anchor
  const idx = a ? cards.findIndex((c, i) => c?.id === a.id && sectionOf[i] === a.section) : -1
  currentPage.value = idx < 0 ? 0 : Math.floor(idx / cardsPerPage.value)
})
watch([currentPage, layout], () => {
  const start = currentPage.value * cardsPerPage.value
  currentViewClass.value = layout.value.sectionOf[start] ?? null
}, { immediate: true })

// Touch: swipe to turn pages, long-press to zoom
const SWIPE_MIN = 50
const LONG_PRESS_MS = 450
const PRESS_SLOP = 10

let swipeStart: { x: number; y: number } | null = null

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  swipeStart = e.touches.length === 1 && touch ? { x: touch.clientX, y: touch.clientY } : null
}

function onTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  if (!swipeStart || !touch) return
  const dx = touch.clientX - swipeStart.x
  const dy = touch.clientY - swipeStart.y
  swipeStart = null
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return
  goToPage(currentPage.value + (dx < 0 ? 1 : -1))
}

let pressTimer: ReturnType<typeof setTimeout> | null = null
let pressOrigin = { x: 0, y: 0 }
let suppressClick = false

function cancelPress() {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = null
}

function onPressStart(card: Card, e: PointerEvent) {
  suppressClick = false
  cancelPress()
  if (e.pointerType === 'mouse') return
  pressOrigin = { x: e.clientX, y: e.clientY }
  pressTimer = setTimeout(() => {
    pressTimer = null
    suppressClick = true // the release must not also add the card
    zoomedCard.value = card
  }, LONG_PRESS_MS)
}

function onPressMove(e: PointerEvent) {
  if (pressTimer && Math.hypot(e.clientX - pressOrigin.x, e.clientY - pressOrigin.y) > PRESS_SLOP) cancelPress()
}

function onCardClick(card: Card) {
  if (suppressClick) {
    suppressClick = false
    return
  }
  if (deckActive.value) addCard(card)
  else zoomedCard.value = card
}

function onCardContextMenu(card: Card) {
  cancelPress()
  zoomedCard.value = card
}

let ro: ResizeObserver | null = null
onMounted(() => {
  if (gridContainer.value) {
    containerWidth.value = gridContainer.value.clientWidth
    containerHeight.value = gridContainer.value.clientHeight
    ro = new ResizeObserver(entries => {
      containerWidth.value = entries[0]!.contentRect.width
      containerHeight.value = entries[0]!.contentRect.height
    })
    ro.observe(gridContainer.value)
  }
})
onBeforeUnmount(() => {
  ro?.disconnect()
  cancelPress()
})
</script>

<template>
  <div
    ref="gridContainer"
    class="card-grid flex-1 overflow-hidden relative"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div v-if="loading" class="flex items-center justify-center h-full text-ink-muted">
      {{ t('Loading cards…', 'Chargement des cartes…') }}
    </div>

    <template v-else>
      <button
        v-if="currentPage > 0"
        class="page-arrow page-arrow--left"
        :aria-label="t('Previous page', 'Page précédente')"
        @click="goToPage(currentPage - 1)"
      >‹</button>

      <button
        v-if="currentPage < totalPages - 1"
        class="page-arrow page-arrow--right"
        :aria-label="t('Next page', 'Page suivante')"
        @click="goToPage(currentPage + 1)"
      >›</button>

      <div class="page-counter">
        {{ currentPage + 1 }}&thinsp;/&thinsp;{{ totalPages }}
      </div>

      <div :style="{ padding: `${padTop}px ${H_PADDING / 2}px ${padBottom}px` }">
        <div
          class="grid justify-center"
          :style="{
            gridTemplateRows: `repeat(${rows}, ${cardH}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${cardW}px`,
            columnGap: `${GAP}px`,
            rowGap: `${ROW_GAP}px`,
          }"
        >
          <template v-for="(card, i) in pageCards" :key="card?.id ?? `empty-${i}`">
            <button
              v-if="card"
              class="grid-card relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition"
              :class="deckActive ? 'cursor-pointer hover:brightness-110' : 'cursor-zoom-in'"
              :style="`width: ${cardW}px; height: ${cardH}px;`"
              @click="onCardClick(card)"
              @contextmenu.prevent="onCardContextMenu(card)"
              @pointerdown="onPressStart(card, $event)"
              @pointermove="onPressMove"
              @pointerup="cancelPress"
              @pointercancel="cancelPress"
              @pointerleave="cancelPress"
            >
              <CardComponent :card="card" :scale="scale" :count="getCount(card.id) || undefined" />
            </button>
            <div
              v-else
              :style="`width: ${cardW}px; height: ${cardH}px;`"
            />
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card-grid {
  touch-action: pan-y pinch-zoom;
}

.grid-card {
  -webkit-touch-callout: none;
  user-select: none;
}

.page-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 36px;
  height: 90px;
  background: rgba(14, 11, 8, 0.8);
  border: 1px solid var(--color-line-strong);
  color: var(--color-ink-soft);
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--radius-ui);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
}
.page-arrow:hover {
  background: rgba(14, 11, 8, 0.94);
  border-color: #8c7860;
  color: #fff;
}

.page-arrow--left  { left: 6px; }
.page-arrow--right { right: 6px; }

.page-counter {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  color: var(--color-ink-muted);
  letter-spacing: 0.08em;
  pointer-events: none;
}

@media (max-height: 560px) {
  .page-arrow { width: 30px; height: 64px; font-size: 22px; }
  .page-arrow--left  { left: 2px; }
  .page-arrow--right { right: 2px; }
  .page-counter { bottom: 6px; font-size: 14px; }
}
</style>
