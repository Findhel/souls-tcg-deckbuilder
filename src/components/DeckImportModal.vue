<script setup lang="ts">
import { computed } from 'vue'
import { heroes } from '@/data/heroes'
import { classes, classAccent } from '@/data/classes'
import { useLang } from '@/composables/useLang'
import type { DecodedDeck } from '@/composables/useDeckUrl'

const props = defineProps<{
  deck: DecodedDeck
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { lang, t } = useLang()

const cardCount = computed(() => props.deck.cards.reduce((s, c) => s + c.count, 0))

const heroName = computed(() => {
  if (!props.deck.heroId) return null
  return heroes.find(h => h.id === props.deck.heroId)?.[lang.value].name ?? null
})

const classDef = computed(() => classes.find(c => c.id === props.deck.deckClass) ?? null)
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-box" role="dialog" aria-modal="true">
        <h2 class="modal-title">{{ t('Import a shared deck', 'Importer un deck partagé') }}</h2>

        <div class="deck-preview">
          <div class="deck-preview-row">
            <img v-if="classDef" class="class-icon" :src="classDef.icon" alt="" />
            <span class="deck-preview-name">{{ deck.name }}</span>
          </div>

          <div class="deck-preview-meta">
            <span v-if="classDef" class="meta-tag" :style="{ color: classAccent(classDef.id) }">
              {{ classDef.label }}
            </span>
            <span v-if="heroName" class="meta-sep">·</span>
            <span v-if="heroName" class="meta-tag">{{ heroName }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-tag">{{ cardCount }} {{ t('cards', 'cartes') }}</span>
            <template v-if="deck.items.length > 0">
              <span class="meta-sep">·</span>
              <span class="meta-tag">{{ deck.items.length }} {{ t('items', 'objets') }}</span>
            </template>
          </div>
        </div>

        <p class="modal-warning">
          {{ t(
            "This won't overwrite your existing decks. The deck will open in edit mode.",
            "Cela n'écrasera pas tes decks existants. Le deck sera chargé en mode édition.",
          ) }}
        </p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="emit('cancel')">{{ t('Dismiss', 'Ignorer') }}</button>
          <button class="btn-confirm" @click="emit('confirm')">{{ t('Import deck', 'Importer le deck') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-box {
  background: var(--surface-popup);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-ui);
  padding: 28px 32px;
  width: 380px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85);
}

.modal-title {
  font-family: var(--font-title);
  font-size: 17px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 20px;
  letter-spacing: 0.04em;
}

.deck-preview {
  background: var(--color-bar);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-ui);
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.deck-preview-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.class-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.deck-preview-name {
  font-family: var(--font-title);
  font-size: 16px;
  color: var(--color-ink);
  font-weight: 700;
}

.deck-preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 13px;
  color: var(--color-ink-soft);
}

.meta-sep {
  font-size: 13px;
  color: var(--color-ink-faint);
}

.modal-warning {
  font-size: 13px;
  color: var(--color-ink-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 18px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover {
  border-color: #8c7860;
  color: #fff;
}

.btn-confirm {
  padding: 8px 18px;
  border-radius: var(--radius-ui);
  border: 1px solid #3d7a52;
  background: rgba(40, 100, 60, 0.24);
  color: #8fe0b0;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-confirm:hover {
  border-color: #4a9c6a;
  background: rgba(40, 100, 60, 0.38);
  color: #b4f0cc;
}

@media (max-height: 560px) {
  .modal-box { padding: 16px 20px; }
  .modal-title { margin-bottom: 12px; }
  .deck-preview { margin-bottom: 10px; padding: 10px 14px; }
  .modal-warning { margin-bottom: 14px; }
}
</style>
