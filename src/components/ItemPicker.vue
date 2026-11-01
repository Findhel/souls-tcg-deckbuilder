<script setup lang="ts">
import { computed } from 'vue'
import { useItems, itemVisual, MAX_DECK_ITEMS } from '@/composables/useItems'
import { useDeck } from '@/composables/useDeck'
import { useLang } from '@/composables/useLang'
import { useLayout } from '@/composables/useLayout'
import CardComponent from '@/components/Card.vue'


const emit = defineEmits<{ close: [] }>()

const { items } = useItems()
const { items: selection, toggleItem } = useDeck()
const { lang, t } = useLang()
const { isShort } = useLayout()

const scale = computed(() => (isShort.value ? 0.5 : 0.68))

const sorted = computed(() =>
  [...items.value].sort((a, b) => a.price - b.price || a[lang.value].name.localeCompare(b[lang.value].name))
)

const full = computed(() => selection.value.length >= MAX_DECK_ITEMS)
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2 class="modal-title">
            {{ t("Choose this deck's items", 'Choisissez les objets de ce deck') }} — {{ selection.length }}/{{ MAX_DECK_ITEMS }}
          </h2>
          <button class="btn-confirm" @click="emit('close')">{{ t('Confirm', 'Valider') }}</button>
        </div>

        <div class="item-grid" :style="{ '--cell-w': `${Math.round(250 * scale) + 16}px` }">
          <button
            v-for="item in sorted"
            :key="item.id"
            class="item-cell"
            :class="{ selected: selection.includes(item.id), locked: full && !selection.includes(item.id) }"
            @click="toggleItem(item.id)"
          >
            <div class="item-card" :style="{ width: `${250 * scale}px`, height: `${350 * scale}px` }">
              <CardComponent :card="itemVisual(item)" :scale="scale" />
            </div>
            <span class="item-price">{{ item.price }} {{ t('souls', 'âmes') }}</span>
          </button>
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
  padding: 22px 26px 26px;
  width: min(1180px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.modal-title {
  font-family: var(--font-title);
  font-size: 17px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
  letter-spacing: 0.04em;
}

.btn-confirm {
  padding: 7px 18px;
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
  color: #9de8bc;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--cell-w), 1fr));
  gap: 14px 8px;
  overflow-y: auto;
  padding: 10px 6px 4px;
}

.item-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 4px 8px;
  border-radius: var(--radius-ui);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.item-cell:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-line-strong);
}
.item-cell.selected {
  border-color: #d4a017;
  background: rgba(212, 160, 23, 0.12);
  box-shadow: 0 0 14px rgba(212, 160, 23, 0.3);
}
.item-cell.locked {
  opacity: 0.45;
  cursor: default;
}

.item-card {
  position: relative;
  flex-shrink: 0;
}

.item-price {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  color: var(--color-gold);
  letter-spacing: 0.04em;
}

@media (max-height: 560px) {
  .modal-box {
    padding: 12px 14px 14px;
    max-height: calc(100dvh - 16px);
    width: calc(100vw - 16px);
  }
  .modal-head { margin-bottom: 6px; }
  .modal-title { font-size: 15px; }
  .item-grid { gap: 8px 4px; padding: 6px 2px 2px; }
  .item-cell { padding: 6px 2px; gap: 4px; }
  .item-price { font-size: 13px; }
}
</style>
