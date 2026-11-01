<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { heroes } from '@/data/heroes'
import { starterDecks } from '@/data/starterDecks'
import type { StarterDeck } from '@/data/starterDecks'
import { useDeck, DECK_SIZE } from '@/composables/useDeck'
import { useCards } from '@/composables/useCards'
import { useItems, MAX_DECK_ITEMS } from '@/composables/useItems'
import { useDeckStorage } from '@/composables/useDeckStorage'
import { useLang } from '@/composables/useLang'
import { classes, classAccent, getClassIcon } from '@/data/classes'
import { buildShareUrl } from '@/composables/useDeckUrl'
import { useLayout } from '@/composables/useLayout'
import type { Card } from '@/composables/useCards'
import CardComponent from '@/components/Card.vue'
import ItemPicker from '@/components/ItemPicker.vue'

const {
  hero, cards, items: deckItems, totalCount, removeCard, deckActive, deckClass, deckName, activeDeckId,
  openNewDeck, loadSavedDeck, closeDeck, setHero,
} = useDeck()
const { cards: allCards } = useCards()
const { items: allItems } = useItems()
const { savedDecks, saveDeck, deleteDeck } = useDeckStorage()
const { lang, t } = useLang()
const { isDrawer, isShort, viewportW, viewportH, panelOpen, setPanelOpen, zoomedCard } = useLayout()

// 'list' | 'pick-class' — editing state is driven by deckActive
const panelView = ref<'list' | 'pick-class'>('list')
const listTab = ref<'mine' | 'starter'>('mine')
const curveOpen = ref(!isShort.value)
const itemPickerOpen = ref(false)

const classHeroes = computed(() =>
  deckClass.value ? heroes.filter(h => h.class === deckClass.value) : []
)

const deckClassDef = computed(() => classes.find(c => c.id === deckClass.value) ?? null)

const sortedCards = computed(() => {
  const l = lang.value
  return [...cards.value].sort((a, b) => a.card.cost - b.card.cost || a.card[l].name.localeCompare(b.card[l].name))
})

const selectedItems = computed(() =>
  deckItems.value.map(id => allItems.value.find(i => i.id === id)).filter(i => i !== undefined)
)

function startPickClass() {
  panelView.value = 'pick-class'
}

function startNewDeck(cls: string) {
  const label = classes.find(c => c.id === cls)?.label ?? cls
  openNewDeck(cls, t(`${label} Deck`, `Deck ${label}`))
  panelView.value = 'list'
  if (isDrawer.value) setPanelOpen(false)
}

function openSavedDeck(id: string) {
  const saved = savedDecks.value.find(d => d.id === id)
  if (!saved) return
  loadSavedDeck(saved, allCards.value, heroes)
}

const heroById = new Map(heroes.map(h => [h.id, h]))

function starterKindLabel(deck: StarterDeck): string {
  return deck.kind === 'starter' ? t('Starter', 'Starter') : t('Adventure', 'Aventure')
}

const starterRows = computed(() => {
  const l = lang.value
  return starterDecks.map(deck => {
    const h = heroById.get(deck.hero) ?? null
    return {
      deck,
      hero: h,
      name: h ? h[l].name : deck.title,
      classLabel: classes.find(c => c.id === deck.class)?.label ?? deck.class,
      kind: starterKindLabel(deck),
    }
  })
})

function openStarterDeck(deck: StarterDeck) {
  const h = heroById.get(deck.hero)
  loadSavedDeck(
    {
      name: `${h ? h[lang.value].name : deck.title} · ${starterKindLabel(deck)}`,
      deckClass: deck.class,
      heroId: deck.hero,
      cards: deck.cards,
      items: deck.items,
    },
    allCards.value,
    heroes,
  )
}

function handleBackFromEditing() {
  itemPickerOpen.value = false
  closeDeck()
}

function handleSave() {
  const entries = cards.value.map(e => ({ id: e.card.id, count: e.count }))
  const saved = saveDeck(deckClass.value!, hero.value?.id ?? null, entries, [...deckItems.value], deckName.value, activeDeckId.value ?? undefined)
  activeDeckId.value = saved.id
}

// Two-step delete: always visible on touch, so a single tap must not lose a deck
const pendingDelete = ref<string | null>(null)
let pendingDeleteTimer: ReturnType<typeof setTimeout> | null = null

function handleDelete(id: string) {
  if (pendingDeleteTimer) clearTimeout(pendingDeleteTimer)
  if (pendingDelete.value !== id) {
    pendingDelete.value = id
    pendingDeleteTimer = setTimeout(() => { pendingDelete.value = null }, 3000)
    return
  }
  pendingDelete.value = null
  deleteDeck(id)
}

function onHeroChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  setHero(heroes.find(h => h.id === id) ?? null)
}

const manaCurve = computed(() => {
  const buckets = Array(8).fill(0) as number[]
  for (const entry of cards.value) {
    const cost = Math.min(entry.card.cost, 7)
    buckets[cost] = (buckets[cost] ?? 0) + entry.count
  }
  return buckets
})

const manaCurveMax = computed(() => Math.max(1, ...manaCurve.value))

const rarityColor: Record<string, string> = {
  Base:      'text-gray-400',
  Common:    'text-white',
  Rare:      'text-blue-400',
  Epic:      'text-purple-400',
  Legendary: 'text-yellow-400',
}

const copiedUrl = ref(false)

function handleShare() {
  const url = buildShareUrl({
    name: deckName.value,
    deckClass: deckClass.value ?? '',
    heroId: hero.value?.id ?? null,
    cards: cards.value.map(e => ({ id: e.card.id, count: e.count })),
    items: [...deckItems.value],
  })
  navigator.clipboard.writeText(url).then(() => {
    copiedUrl.value = true
    setTimeout(() => { copiedUrl.value = false }, 2000)
  })
}

// A line removed under the pointer never gets its pointerleave: close the preview here
const PANEL_W = 384
const hoveredCard = ref<Card | null>(null)
let hoverTimer: ReturnType<typeof setTimeout> | null = null
let pendingPreviewId: string | null = null
let lastPointer = 'mouse'

const previewRight = computed(() => (isDrawer.value ? Math.min(PANEL_W, viewportW.value * 0.9) : PANEL_W) + 24)
const previewScale = computed(() =>
  Math.min(1.5, (viewportH.value - 32) / 350, (viewportW.value - previewRight.value - 24) / 250)
)

function showPreview(card: Card, e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  if (hoverTimer) clearTimeout(hoverTimer)
  pendingPreviewId = card.id
  hoverTimer = setTimeout(() => {
    hoverTimer = null
    pendingPreviewId = null
    hoveredCard.value = card
  }, 350)
}

function hidePreview() {
  if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null }
  pendingPreviewId = null
  hoveredCard.value = null
}

watch([() => cards.value.length, deckActive, panelOpen], () => {
  const id = hoveredCard.value?.id ?? pendingPreviewId
  if (!id) return
  if (!deckActive.value || !panelOpen.value || !cards.value.some(e => e.card.id === id)) hidePreview()
})

function onLinePointerDown(e: PointerEvent) {
  lastPointer = e.pointerType
}

function onLineClick(card: Card) {
  if (lastPointer !== 'mouse') zoomedCard.value = card
}
</script>

<template>
  <aside
    class="deck-panel"
    :class="{ 'is-drawer': isDrawer, 'is-open': panelOpen }"
    :inert="!panelOpen"
    :aria-label="t('Decks', 'Decks')"
  >
  <div class="deck-panel-inner">
    <button
      v-if="isDrawer"
      class="panel-close"
      :aria-label="t('Close the deck panel', 'Fermer le panneau des decks')"
      @click="setPanelOpen(false)"
    >✕</button>

    <template v-if="deckActive">
      <div class="panel-scroll">
      <div class="px-4 py-3 flex flex-col gap-2 panel-sep">
        <button class="back-row-btn" @click="handleBackFromEditing">
          ← {{ listTab === 'starter' ? t('Starter decks', 'Starter decks') : t('My decks', 'Mes decks') }}
        </button>

        <div class="flex items-center gap-2">
          <img v-if="deckClassDef" class="class-icon-sm" :src="deckClassDef.icon" :alt="deckClassDef.label" />
          <input class="deck-name-input flex-1" v-model="deckName" />
          <span :class="totalCount >= DECK_SIZE ? 'text-yellow-400' : 'text-ink-muted'" class="deck-total shrink-0">
            {{ totalCount }}/{{ DECK_SIZE }}
          </span>
        </div>

        <div v-if="classHeroes.length > 0" class="flex items-center gap-2">
          <div
            v-if="hero"
            class="hero-portrait shrink-0"
            :style="{ '--ring': classAccent(hero.class) }"
          >
            <img :src="hero.portrait" :alt="hero[lang].name" />
          </div>
          <select class="hero-select flex-1 min-w-0" :value="hero?.id ?? ''" :aria-label="t('Hero', 'Héros')" @change="onHeroChange">
            <option value="">{{ t('— Hero —', '— Héros —') }}</option>
            <option v-for="h in classHeroes" :key="h.id" :value="h.id">{{ h[lang].name }}</option>
          </select>
        </div>

        <div v-if="hero" class="hero-power">
          <div class="hero-power-icon">
            <img class="hero-power-art" :src="hero.power.icon" alt="" />
          </div>
          <div class="min-w-0">
            <div class="hero-power-name">
              {{ hero.power[lang].name }}
              <span class="hero-power-cost">{{ hero.power.cost }}</span>
            </div>
            <div class="hero-power-text">{{ hero.power[lang].text }}</div>
          </div>
        </div>

        <div class="items-row">
          <button class="items-btn" @click="itemPickerOpen = true">
            {{ t('Items', 'Objets') }} ({{ deckItems.length }}/{{ MAX_DECK_ITEMS }})
          </button>
          <div class="flex gap-1.5 min-w-0">
            <img
              v-for="item in selectedItems"
              :key="item.id"
              class="item-thumb"
              :src="item.image"
              :alt="item[lang].name"
              :title="`${item[lang].name} — ${item.price} ${t('souls', 'âmes')}\n${item[lang].text}`"
            />
          </div>
        </div>
      </div>

      <div class="mana-curve-section panel-sep">
        <button class="curve-toggle" @click="curveOpen = !curveOpen">
          <span class="curve-toggle-label">{{ t('Mana curve', 'Courbe de mana') }}</span>
          <span class="curve-chevron" :class="{ 'curve-chevron-open': curveOpen }">›</span>
        </button>
        <Transition name="curve">
          <div v-if="curveOpen" class="curve-bars">
            <div v-for="(count, i) in manaCurve" :key="i" class="curve-col">
              <span class="curve-count">{{ count > 0 ? count : '' }}</span>
              <div class="curve-bar-wrap">
                <div
                  class="curve-bar"
                  :style="{ height: count > 0 ? `${(count / manaCurveMax) * 100}%` : '2px' }"
                  :class="count > 0 ? 'curve-bar-active' : 'curve-bar-empty'"
                />
              </div>
              <span class="curve-label">{{ i === 7 ? '7+' : i }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <div class="deck-list">
        <p v-if="cards.length === 0" class="text-[15px] text-ink-muted px-4 py-4">
          {{ t('Click a card to add it.', "Clique sur une carte pour l'ajouter.") }}
        </p>
        <ul v-else class="deck-divider">
          <li
            v-for="entry in sortedCards"
            :key="entry.card.id"
            class="flex items-center gap-2 px-2 py-1 deck-card-item"
            @pointerdown="onLinePointerDown"
            @pointerenter="showPreview(entry.card, $event)"
            @pointerleave="hidePreview"
            @click="onLineClick(entry.card)"
          >
            <span class="dl-cost shrink-0">{{ entry.card.cost }}</span>
            <div class="card-thumb shrink-0">
              <img
                :src="entry.card.image"
                :alt="entry.card[lang].name"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <span
              class="rarity-gem shrink-0"
              :class="rarityColor[entry.card.rarity] ?? 'text-gray-400'"
            />
            <span class="flex-1 text-[15px] text-ink truncate leading-tight min-w-0">{{ entry.card[lang].name }}</span>
            <div
              class="line-actions"
              @pointerenter="hidePreview"
              @pointerleave="showPreview(entry.card, $event)"
            >
              <span
                class="line-count"
                :class="entry.count === 2 ? 'text-orange-400' : 'text-white'"
              >{{ entry.count }}</span>
              <button
                class="line-remove"
                :aria-label="t('Remove one copy', 'Retirer un exemplaire')"
                @click.stop="removeCard(entry.card.id)"
              >−</button>
            </div>
          </li>
        </ul>
      </div>
      </div>

      <div class="px-3 py-3 panel-sep-top flex gap-2">
        <button class="save-btn flex-1" @click="handleSave">
          {{ activeDeckId ? t('↑ Save', '↑ Sauvegarder') : t('+ Save', '+ Enregistrer') }}
        </button>
        <button class="share-btn" :class="{ 'share-btn-copied': copiedUrl }" @click="handleShare" :title="t('Copy share link', 'Copier le lien de partage')">
          {{ copiedUrl ? '✓' : '⎘' }}
        </button>
      </div>

      <ItemPicker v-if="itemPickerOpen" @close="itemPickerOpen = false" />
    </template>

    <template v-else-if="panelView === 'pick-class'">
      <div class="px-4 py-3 flex items-center gap-2 panel-sep">
        <button class="back-btn" :aria-label="t('Back', 'Retour')" @click="panelView = 'list'">←</button>
        <h2 class="panel-title">{{ t('Choose a class', 'Choisir une classe') }}</h2>
      </div>
      <div class="flex-1 overflow-y-auto px-3 py-3">
        <div class="class-grid">
          <button
            v-for="cls in classes"
            :key="cls.id"
            class="class-pick-btn"
            :style="{ '--cls-color': classAccent(cls.id) }"
            @click="startNewDeck(cls.id)"
          >
            <span class="class-pick-ring">
              <img class="class-pick-icon" :src="cls.icon" alt="" />
            </span>
            {{ cls.label }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="px-4 py-3 panel-sep">
        <div class="list-tabs" role="tablist">
          <button
            role="tab"
            class="list-tab"
            :class="{ active: listTab === 'mine' }"
            :aria-selected="listTab === 'mine'"
            @click="listTab = 'mine'"
          >{{ t('My decks', 'Mes decks') }}</button>
          <button
            role="tab"
            class="list-tab"
            :class="{ active: listTab === 'starter' }"
            :aria-selected="listTab === 'starter'"
            @click="listTab = 'starter'"
          >{{ t('Starter decks', 'Starter decks') }}</button>
        </div>
      </div>

      <div v-if="listTab === 'mine'" class="flex-1 overflow-y-auto">
        <p v-if="savedDecks.length === 0" class="text-[15px] text-ink-muted px-4 py-4">
          {{ t('No saved deck.', 'Aucun deck enregistré.') }}
        </p>
        <ul v-else class="deck-divider">
          <li
            v-for="deck in savedDecks"
            :key="deck.id"
            class="deck-list-item"
            @click="openSavedDeck(deck.id)"
          >
            <img class="class-icon-sm" :src="getClassIcon(deck.deckClass)" alt="" />
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-ink truncate">{{ deck.name }}</div>
              <div class="text-[13px] text-ink-muted">{{ deck.cards.reduce((s, c) => s + c.count, 0) }} {{ t('cards', 'cartes') }}</div>
            </div>
            <button
              class="deck-delete"
              :class="{ armed: pendingDelete === deck.id }"
              :aria-label="t('Delete this deck', 'Supprimer ce deck')"
              @click.stop="handleDelete(deck.id)"
            >{{ pendingDelete === deck.id ? t('Delete?', 'Supprimer ?') : '✕' }}</button>
          </li>
        </ul>
      </div>

      <div v-else class="flex-1 overflow-y-auto">
        <p class="text-[13px] text-ink-muted px-4 pt-3 pb-1">
          {{ t(
            'The prebuilt decks of the game. Open one to view or edit it; saving keeps a copy in My decks.',
            'Les decks préconstruits du jeu. Ouvre-en un pour le consulter ou le modifier ; l’enregistrer en garde une copie dans Mes decks.',
          ) }}
        </p>
        <ul class="deck-divider">
          <li
            v-for="row in starterRows"
            :key="row.deck.id"
            class="deck-list-item"
            @click="openStarterDeck(row.deck)"
          >
            <div class="hero-portrait hero-portrait-sm shrink-0" :style="{ '--ring': classAccent(row.deck.class) }">
              <img v-if="row.hero" :src="row.hero.portrait" alt="" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[15px] text-ink truncate">{{ row.name }}</div>
              <div class="flex items-center gap-1.5 text-[13px] text-ink-muted">
                <img class="class-icon-xs" :src="getClassIcon(row.deck.class)" alt="" />
                <span class="truncate">{{ row.classLabel }}</span>
              </div>
            </div>
            <span class="kind-badge" :class="`kind-${row.deck.kind}`">{{ row.kind }}</span>
          </li>
        </ul>
      </div>

      <div v-if="listTab === 'mine'" class="px-3 py-3 panel-sep-top">
        <button class="new-deck-btn" @click="startPickClass">
          {{ t('+ New deck', '+ Nouveau deck') }}
        </button>
      </div>
    </template>

  <Teleport to="body">
    <Transition name="card-preview">
      <div
        v-if="hoveredCard && previewScale >= 0.8"
        class="deck-hover-preview"
        :style="{ right: `${previewRight}px`, '--s': previewScale }"
      >
        <CardComponent :card="hoveredCard" />
      </div>
    </Transition>
  </Teleport>

  </div>
  </aside>
</template>

<style scoped>
/* Docked: folds to 0 width. Drawer: fixed over the grid. */
.deck-panel {
  width: 384px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--surface-panel);
  border-left: 1px solid var(--color-line);
  transition: width 0.25s ease, border-color 0.25s ease;
}
.deck-panel:not(.is-drawer):not(.is-open) {
  width: 0;
  border-left-color: transparent;
}
.deck-panel-inner {
  position: relative;
  width: 384px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.deck-panel.is-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1500;
  width: calc(min(384px, 90vw) + env(safe-area-inset-right));
  padding-right: env(safe-area-inset-right);
  transform: translateX(100%);
  visibility: hidden;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.7);
  transition: transform 0.25s ease, visibility 0s linear 0.25s;
}
.deck-panel.is-drawer.is-open {
  transform: none;
  visibility: visible;
  transition: transform 0.25s ease, visibility 0s;
}
.deck-panel.is-drawer .deck-panel-inner {
  width: 100%;
}

.panel-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: var(--color-raised);
  color: var(--color-ink-soft);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.panel-close:hover {
  color: #fff;
  border-color: #8c7860;
}

.panel-scroll {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.deck-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
/* short screens: everything above the save bar scrolls together */
@media (max-height: 560px) {
  .panel-scroll { overflow-y: auto; }
  .deck-list { flex: none; overflow: visible; }
}

.panel-sep {
  border-bottom: 1px solid var(--color-line);
}
.panel-sep-top {
  border-top: 1px solid var(--color-line);
}
.deck-divider > * + * {
  border-top: 1px solid #2a221a;
}
.deck-card-item:hover {
  background: var(--color-hover);
}

/* deck line count / remove */
.line-actions {
  position: relative;
  width: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.line-count {
  font-size: 15px;
  font-weight: 700;
  transition: opacity 0.15s;
}
.line-remove {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  padding: 0;
  color: var(--color-ink-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}
.line-remove:hover { color: #f87171; }
.deck-card-item:hover .line-count,
.deck-card-item:focus-within .line-count { opacity: 0; }
.deck-card-item:hover .line-remove,
.line-remove:focus-visible { opacity: 1; }

@media (hover: none) {
  .deck-card-item .card-thumb { width: 36%; }
  .line-actions { width: auto; gap: 10px; }
  .deck-card-item:hover .line-count,
  .deck-card-item:focus-within .line-count { opacity: 1; }
  .line-remove {
    position: static;
    opacity: 1;
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-ui);
    background: var(--color-raised);
    color: var(--color-ink-soft);
  }
}

/* inputs / hero */
.deck-name-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-line-strong);
  color: var(--color-ink);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  outline: none;
  padding: 2px 0;
  min-width: 0;
}
.deck-name-input:focus {
  border-bottom-color: #9c876b;
}

.hero-select {
  background: var(--color-raised);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-ui);
  color: var(--color-ink);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.hero-select:focus { border-color: #9c876b; }
.hero-select option { background: #1d1812; color: var(--color-ink); }

.hero-portrait {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  outline: 2px solid var(--ring);
  outline-offset: 1px;
  background: #0e0b08;
}
.hero-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.hero-power {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}
.hero-power-icon {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.hero-power-art {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  border-radius: 50%;
  object-fit: cover;
}
.hero-power-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/assets/ui/hero_power_frame.webp') 0 0 / 100% 100% no-repeat;
}
.hero-power-name {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  color: var(--color-gold);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hero-power-cost {
  width: 18px;
  height: 18px;
  background: url('/assets/ui/rune.webp') 0 0 / 100% 100% no-repeat;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  font-size: 11px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}
.hero-power-text {
  font-size: 13px;
  color: var(--color-ink-soft);
  line-height: 1.35;
}

/* shop items */
.items-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.items-btn {
  padding: 4px 12px;
  border-radius: var(--radius-ui);
  border: 1px solid #6a5a36;
  background: rgba(160, 128, 64, 0.12);
  color: var(--color-gold);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.items-btn:hover {
  border-color: #b8924a;
  background: rgba(160, 128, 64, 0.24);
  color: #fbe7b5;
}
.item-thumb {
  width: 28px;
  height: 28px;
  border-radius: 2px;
  object-fit: cover;
  border: 1px solid #5a4d30;
  background: #1a1612;
}

/* save button */
.save-btn {
  width: 100%;
  padding: 6px;
  border-radius: var(--radius-ui);
  border: 1px solid #3d7a3d;
  background: rgba(40, 100, 40, 0.2);
  color: #8fdc8f;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s;
}
.save-btn:hover {
  border-color: #5cb85c;
  background: rgba(40, 100, 40, 0.34);
  color: #b4f0b4;
}

/* deck list item */
.deck-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.deck-list-item:hover {
  background: var(--color-hover);
}

.deck-delete {
  flex-shrink: 0;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: var(--radius-ui);
  border: 1px solid transparent;
  background: none;
  color: var(--color-ink-faint);
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, border-color 0.15s;
}
.deck-delete:hover { color: #f87171; }
.deck-list-item:hover .deck-delete,
.deck-delete:focus-visible,
.deck-delete.armed { opacity: 1; }
.deck-delete.armed {
  color: #fca5a5;
  border-color: #7f2d2d;
  background: rgba(127, 29, 29, 0.25);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 13px;
}
@media (hover: none) {
  .deck-delete {
    opacity: 1;
    min-width: 32px;
    height: 32px;
    border-color: var(--color-line-strong);
  }
}

/* list tabs (my decks / starter decks) */
.list-tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--radius-ui);
  background: var(--color-raised);
  border: 1px solid var(--color-line);
}
.list-tab {
  flex: 1;
  padding: 5px 8px;
  border-radius: var(--radius-ui);
  border: none;
  background: transparent;
  color: var(--color-ink-muted);
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.list-tab:hover { color: var(--color-ink); }
.list-tab.active {
  background: var(--color-hover);
  color: var(--color-ink);
  box-shadow: inset 0 0 0 1px var(--color-line-strong);
}

/* starter deck rows */
.hero-portrait-sm {
  width: 34px;
  height: 34px;
}
.class-icon-xs {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kind-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--radius-ui);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
  border: 1px solid var(--color-line-strong);
  color: var(--color-ink-soft);
}
.kind-badge.kind-starter {
  border-color: #3d7a3d;
  color: #8fdc8f;
  background: rgba(40, 100, 40, 0.16);
}
.kind-badge.kind-adventure {
  border-color: #6a5a36;
  color: var(--color-gold);
  background: rgba(160, 128, 64, 0.12);
}

/* new deck button */
.new-deck-btn {
  width: 100%;
  padding: 9px;
  border-radius: var(--radius-ui);
  border: 1px dashed var(--color-line-strong);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.18s;
}
.new-deck-btn:hover {
  border-color: #8c7860;
  color: #fff;
  background: rgba(255,255,255,0.04);
}

/* class pick grid */
.class-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.class-pick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px 12px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line);
  background: rgba(0, 0, 0, 0.25);
  color: var(--color-ink-soft);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: center;
  line-height: 1.3;
}
.class-pick-btn:hover {
  border-color: color-mix(in srgb, var(--cls-color) 55%, var(--color-line));
  background: color-mix(in srgb, var(--cls-color) 10%, rgba(0, 0, 0, 0.25));
  color: color-mix(in srgb, var(--cls-color) 35%, white);
}
.class-pick-ring {
  position: relative;
  width: 60px;
  height: 60px;
}
.class-pick-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.class-pick-ring::after {
  content: '';
  position: absolute;
  inset: -9%;
  background: var(--cls-color);
  -webkit-mask: url('/assets/classes/glow.webp') center / 100% 100% no-repeat;
  mask: url('/assets/classes/glow.webp') center / 100% 100% no-repeat;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.class-pick-btn:hover .class-pick-ring::after { opacity: 1; }

.deck-total {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
}

.panel-title {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.04em;
  color: var(--color-gold);
}

/* deck line cost rune */
.dl-cost {
  width: 20px;
  height: 20px;
  background-image: url('/assets/ui/rune.webp');
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  padding-top: 1px;
}

/* mana curve */
.mana-curve-section {
  padding: 0 14px;
}
.curve-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  color: var(--color-ink-muted);
  cursor: pointer;
  padding: 10px 0;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.06em;
  transition: color 0.15s;
}
.curve-toggle:hover { color: var(--color-ink); }
.curve-toggle-label { text-transform: uppercase; }
.curve-chevron {
  font-size: 17px;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.22s ease;
  display: inline-block;
}
.curve-chevron-open {
  transform: rotate(270deg);
}

.curve-enter-active,
.curve-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
  transform-origin: top;
}
.curve-enter-from,
.curve-leave-to {
  opacity: 0;
  transform: scaleY(0.85);
}
.curve-enter-to,
.curve-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

.curve-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 130px;
  padding: 0 40px 12px;
}
.curve-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}
.curve-count {
  font-size: 12px;
  color: var(--color-gold-bright);
  line-height: 1;
  height: 12px;
  display: flex;
  align-items: center;
}
.curve-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}
.curve-bar {
  width: 100%;
  border-radius: 2px 2px 0 0;
  transition: height 0.2s ease;
}
.curve-bar-active {
  background: linear-gradient(to top, #c47a00, #f5bc45);
}
.curve-bar-empty {
  background: #3a3026;
  border-radius: 1px;
}
.curve-label {
  font-size: 13px;
  color: var(--color-ink-muted);
  font-family: var(--font-title);
  font-weight: 700;
  line-height: 1;
}

/* deck card items */
.card-thumb {
  width: 50%;
  height: 46px;
  border-radius: 2px;
  overflow: hidden;
  background: #0e0b08;
  flex-shrink: 0;
}
.rarity-gem {
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: currentColor;
  display: block;
  flex-shrink: 0;
}

/* deck hover preview */
.deck-hover-preview {
  position: fixed;
  top: 50%;
  transform: translateY(-50%) scale(var(--s));
  transform-origin: center right;
  z-index: 1000;
  pointer-events: none;
  filter: drop-shadow(0 12px 40px rgba(0, 0, 0, 0.85));
}

.card-preview-enter-active,
.card-preview-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.card-preview-enter-from,
.card-preview-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(calc(var(--s) * 0.9));
}
.card-preview-enter-to,
.card-preview-leave-from {
  opacity: 1;
  transform: translateY(-50%) scale(var(--s));
}

/* misc */
.class-icon-sm {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}
.back-btn {
  background: none;
  border: none;
  color: var(--color-ink-muted);
  cursor: pointer;
  font-size: 17px;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--color-ink); }

.back-row-btn {
  background: none;
  border: none;
  color: var(--color-ink-muted);
  cursor: pointer;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  padding: 0;
  text-align: left;
  transition: color 0.15s;
}
.back-row-btn:hover { color: var(--color-ink); }

/* share button */
.share-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: transparent;
  color: var(--color-ink-soft);
  font-size: 17px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.share-btn:hover {
  border-color: #8c7860;
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
}
.share-btn-copied {
  border-color: #3d7a52;
  color: #8fe0b0;
  background: rgba(40, 100, 60, 0.2);
}
</style>
