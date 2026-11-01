<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import FilterBar from '@/components/FilterBar.vue'
import BottomBar from '@/components/BottomBar.vue'
import CardGrid from '@/components/CardGrid.vue'
import DeckPanel from '@/components/DeckPanel.vue'
import DeckImportModal from '@/components/DeckImportModal.vue'
import CardZoom from '@/components/CardZoom.vue'
import { useCards } from '@/composables/useCards'
import { useDeck } from '@/composables/useDeck'
import { useLayout } from '@/composables/useLayout'
import { decodeDeck, clearDeckParam } from '@/composables/useDeckUrl'
import { heroes } from '@/data/heroes'
import type { DecodedDeck } from '@/composables/useDeckUrl'

const { loadSavedDeck } = useDeck()
const { cards: allCards } = useCards()
const { isDrawer, panelOpen, setPanelOpen, zoomedCard } = useLayout()

const pendingImport = ref<DecodedDeck | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (zoomedCard.value) zoomedCard.value = null
  else if (isDrawer.value && panelOpen.value) setPanelOpen(false)
}
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('deck')
  if (!encoded) return
  const decoded = decodeDeck(encoded)
  if (decoded) {
    pendingImport.value = decoded
  } else {
    clearDeckParam()
  }
})

function handleImportConfirm() {
  if (!pendingImport.value) return
  const d = pendingImport.value
  loadSavedDeck(
    {
      name: d.name,
      deckClass: d.deckClass,
      heroId: d.heroId,
      cards: d.cards,
      items: d.items,
    },
    allCards.value,
    heroes,
  )
  clearDeckParam()
  pendingImport.value = null
  setPanelOpen(true)
}

function handleImportCancel() {
  clearDeckParam()
  pendingImport.value = null
}
</script>

<template>
  <div class="app-shell flex h-dvh text-white overflow-hidden">
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <FilterBar />
      <CardGrid />
      <BottomBar />
    </div>
    <Transition name="backdrop">
      <div v-if="isDrawer && panelOpen" class="drawer-backdrop" @click="setPanelOpen(false)" />
    </Transition>
    <DeckPanel />
  </div>

  <CardZoom />

  <DeckImportModal
    v-if="pendingImport"
    :deck="pendingImport"
    @confirm="handleImportConfirm"
    @cancel="handleImportCancel"
  />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Crimson+Pro:wght@500;600;700&display=swap');

* {
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
}

.app-shell {
  background: transparent;
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1400;
  background: rgba(0, 0, 0, 0.6);
}
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
