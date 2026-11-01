<script setup lang="ts">
import { computed, watch } from 'vue'
import { useLayout } from '@/composables/useLayout'
import { useLang } from '@/composables/useLang'
import { useDeck, maxCopies as deckMaxCopies } from '@/composables/useDeck'
import { useCards, type CardVisual, type RelationKind } from '@/composables/useCards'
import { useItems, itemVisual } from '@/composables/useItems'
import { keywordsIn } from '@/data/keywords'
import CardComponent from '@/components/Card.vue'


const { zoomedCard, viewportW, viewportH } = useLayout()
const { lang, t } = useLang()
const { deckActive, canAddCard, addCard, removeCard, getCount } = useDeck()
const { cards, tokens } = useCards()
const { items } = useItems()

const PANEL_W = 300
const GAP = 24
const REL_GAP = 12
const MARGIN = 32

const visuals = computed(() => {
  const map = new Map<string, CardVisual>()
  for (const c of cards.value) map.set(c.id, c)
  for (const c of tokens.value) map.set(c.id, c)
  for (const i of items.value) map.set(i.id, itemVisual(i))
  return map
})

const KIND_LABELS: Record<RelationKind, [string, string]> = {
  summon: ['Summons', 'Invoque'],
  equip: ['Equips', 'Équipe'],
  transform: ['Transforms into', 'Transforme en'],
  random: ['Can give', 'Peut donner'],
  reward: ['Quest reward', 'Récompense de quête'],
}

const groups = computed(() => {
  const out: { kind: RelationKind; label: string; cards: CardVisual[] }[] = []
  for (const r of zoomedCard.value?.related ?? []) {
    const card = visuals.value.get(r.id)
    if (!card) continue
    let group = out.find(g => g.kind === r.kind)
    if (!group) {
      const [en, fr] = KIND_LABELS[r.kind]
      group = { kind: r.kind, label: t(en, fr), cards: [] }
      out.push(group)
    }
    group.cards.push(card)
  }
  return out
})
const relCount = computed(() => groups.value.reduce((n, g) => n + g.cards.length, 0))
// one related card = 3/4 of the zoomed card, two = side by side at 0.6, more = a 2×2 grid at about half
const relCols = computed(() => Math.min(relCount.value, 2))
const relFactor = computed(() => [0, 0.75, 0.6][relCount.value] ?? 0.46)

const tips = computed(() => {
  if (!zoomedCard.value) return []
  const texts = [zoomedCard.value, ...groups.value.flatMap(g => g.cards)].map(c => c[lang.value].text)
  const seen = new Set<string>()
  return texts.flatMap(text => keywordsIn(text, lang.value)).filter(k => !seen.has(k.name) && seen.add(k.name))
})
const hasSide = computed(() => tips.value.length > 0 || deckActive.value)

const rowScale = computed(() => {
  let fixed = MARGIN
  if (hasSide.value) fixed += GAP + PANEL_W
  if (relCount.value) fixed += GAP + (relCols.value - 1) * REL_GAP
  const perScale = 250 + (relCount.value ? relCols.value * 250 * relFactor.value : 0)
  return (viewportW.value - fixed) / perScale
})

const sideBySide = computed(() => (!hasSide.value && !relCount.value) || rowScale.value >= 1.1)

const scale = computed(() => {
  const byHeight = (viewportH.value - MARGIN) / 350
  if (sideBySide.value) return Math.min(1.6, byHeight, rowScale.value)
  return Math.min(1.6, (viewportH.value * 0.62) / 350, (viewportW.value - MARGIN) / 250)
})

const relScale = computed(() =>
  sideBySide.value
    ? scale.value * relFactor.value
    : Math.min(scale.value * 0.75, (viewportW.value - MARGIN - (relCount.value - 1) * REL_GAP) / (relCount.value * 250))
)
const relWidth = computed(() =>
  sideBySide.value ? relCols.value * 250 * relScale.value + (relCols.value - 1) * REL_GAP : undefined
)

const count = computed(() => (zoomedCard.value ? getCount(zoomedCard.value.id) : 0))
const maxCopies = computed(() => (zoomedCard.value ? deckMaxCopies(zoomedCard.value) : 2))

// The release of the long-press that opened the zoom must not close it
let armed = false
watch(zoomedCard, () => {
  armed = false
})

function arm() {
  armed = true
}

function close() {
  if (armed) zoomedCard.value = null
}
</script>

<template>
  <Transition name="zoom">
    <div v-if="zoomedCard" class="zoom-overlay" @pointerdown="arm" @click="close">
      <div class="zoom-body" :class="{ 'is-stacked': !sideBySide }">
        <div class="zoom-card" :style="{ width: `${250 * scale}px`, height: `${350 * scale}px` }">
          <CardComponent :card="zoomedCard" :scale="scale" />
        </div>

        <div v-if="relCount" class="zoom-related" :style="relWidth ? { width: `${relWidth}px` } : undefined">
          <div v-for="group in groups" :key="group.kind" class="rel-group">
            <!-- the cost gem sticks out above the card: keep the label clear of it -->
            <div class="rel-label" :style="{ marginBottom: `${18 * relScale}px` }">{{ group.label }}</div>
            <div class="rel-cards">
              <div
                v-for="(card, i) in group.cards"
                :key="i"
                class="rel-card"
                :style="{ width: `${250 * relScale}px`, height: `${350 * relScale}px` }"
              >
                <CardComponent :card="card" :scale="relScale" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasSide" class="zoom-side" :style="sideBySide ? { width: `${PANEL_W}px` } : undefined">
          <div v-for="tip in tips" :key="tip.name" class="tip">
            <div class="tip-name">{{ tip.name }}</div>
            <div class="tip-desc">{{ tip.desc }}</div>
          </div>

          <div v-if="deckActive" class="deck-controls" @click.stop>
            <button
              class="deck-btn"
              :disabled="count === 0"
              :aria-label="t('Remove from deck', 'Retirer du deck')"
              @click="removeCard(zoomedCard.id)"
            >−</button>
            <span class="deck-count">{{ count }}&thinsp;/&thinsp;{{ maxCopies }}</span>
            <button
              class="deck-btn"
              :disabled="!canAddCard(zoomedCard)"
              :aria-label="t('Add to deck', 'Ajouter au deck')"
              @click="addCard(zoomedCard)"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  overflow-y: auto;
  padding: 16px;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(3px);
  cursor: zoom-out;
}
.zoom-body {
  display: flex;
  align-items: center;
  gap: 24px;
  margin: auto;
}
.zoom-body.is-stacked {
  flex-direction: column;
  gap: 16px;
}
.zoom-card {
  position: relative;
  flex: none;
  filter: drop-shadow(0 12px 40px rgba(0, 0, 0, 0.85));
}

.zoom-related {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: none;
}
.is-stacked .zoom-related {
  align-items: center;
}
.rel-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.is-stacked .rel-group {
  align-items: center;
}
.rel-label {
  color: var(--color-gold);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rel-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.is-stacked .rel-cards {
  flex-wrap: nowrap;
  justify-content: center;
}
.rel-card {
  position: relative;
  flex: none;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.8));
}

.zoom-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 100%;
}
.is-stacked .zoom-side {
  width: min(420px, calc(100vw - 32px));
}
.tip {
  background: var(--surface-popup);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-ui);
  padding: 10px 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
}
.tip-name {
  color: var(--color-gold);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.02em;
  margin-bottom: 3px;
}
.tip-desc {
  color: var(--color-ink-soft);
  font-size: 16px;
  line-height: 1.4;
}

.deck-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 4px;
  cursor: default;
}
.deck-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: var(--color-raised);
  color: var(--color-ink);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}
.deck-btn:hover:not(:disabled) {
  background: var(--color-hover);
  border-color: var(--color-gold);
  color: var(--color-gold);
}
.deck-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.deck-count {
  color: var(--color-ink-soft);
  font-size: 16px;
  min-width: 44px;
  text-align: center;
}

@media (max-height: 560px) {
  .tip {
    padding: 6px 10px;
  }
  .tip-name {
    font-size: 14px;
  }
  .tip-desc {
    font-size: 13px;
  }
}

.zoom-enter-active,
.zoom-leave-active {
  transition: opacity 0.18s ease;
}
.zoom-enter-active .zoom-card,
.zoom-leave-active .zoom-card {
  transition: transform 0.18s ease;
}
.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
}
.zoom-enter-from .zoom-card,
.zoom-leave-to .zoom-card {
  transform: scale(0.92);
}
</style>
