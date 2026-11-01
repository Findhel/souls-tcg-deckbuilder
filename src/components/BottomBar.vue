<script setup lang="ts">
import { useFilters } from '@/composables/useFilters'
import { useLang } from '@/composables/useLang'

const { selectedCost, searchQuery, selectedType, selectedRarity, toggleCost, toggleType } = useFilters()
const { t } = useLang()

const COSTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const TYPES = [
  { id: 'minion', en: 'Minion', fr: 'Serviteur' },
  { id: 'spell', en: 'Spell', fr: 'Sort' },
  { id: 'weapon', en: 'Weapon', fr: 'Arme' },
  { id: 'terrain', en: 'Terrain', fr: 'Terrain' },
  { id: 'invocation', en: 'Summon', fr: 'Invocation' },
  { id: 'quest', en: 'Quest', fr: 'Quête' },
]

const RARITIES = [
  { id: 'Base', en: 'Base', fr: 'Base' },
  { id: 'Common', en: 'Common', fr: 'Commune' },
  { id: 'Rare', en: 'Rare', fr: 'Rare' },
  { id: 'Epic', en: 'Epic', fr: 'Épique' },
  { id: 'Legendary', en: 'Legendary', fr: 'Légendaire' },
]

function onRarityChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  selectedRarity.value = v || null
}

function onTypeChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  selectedType.value = v || null
}
</script>

<template>
  <div class="bottom-bar">
    <div class="cost-filters">
      <button
        v-for="cost in COSTS"
        :key="cost"
        class="cost-btn"
        :class="{ active: selectedCost === cost }"
        @click="toggleCost(cost)"
      >
        {{ cost === 10 ? '10+' : cost }}
      </button>
    </div>

    <div class="divider" />

    <div class="type-filters">
      <button
        v-for="type in TYPES"
        :key="type.id"
        class="type-pill"
        :class="{ active: selectedType === type.id }"
        @click="toggleType(type.id)"
      >
        {{ t(type.en, type.fr) }}
      </button>
    </div>
    <!-- compact layouts: the type pills become a select -->
    <select class="filter-select type-select" :class="{ active: selectedType }" :value="selectedType ?? ''" @change="onTypeChange">
      <option value="">{{ t('Type', 'Type') }}</option>
      <option v-for="type in TYPES" :key="type.id" :value="type.id">{{ t(type.en, type.fr) }}</option>
    </select>

    <div class="divider" />

    <select class="filter-select" :class="{ active: selectedRarity }" :value="selectedRarity ?? ''" @change="onRarityChange">
      <option value="">{{ t('Rarity', 'Rareté') }}</option>
      <option v-for="r in RARITIES" :key="r.id" :value="r.id">{{ t(r.en, r.fr) }}</option>
    </select>

    <div class="search-wrap">
      <svg class="search-icon" viewBox="0 0 20 20" fill="none">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5" />
        <path d="M13 13l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <input
        v-model="searchQuery"
        class="search-input"
        :placeholder="t('Search…', 'Rechercher…')"
        :aria-label="t('Search', 'Rechercher')"
        type="search"
      />
    </div>
  </div>
</template>

<style scoped>
.bottom-bar {
  container: bottombar / inline-size;
  background: var(--surface-bar);
  border-top: 1px solid var(--color-line);
  padding: 10px 16px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  flex-shrink: 0;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 5px;
}

.divider {
  width: 1px;
  height: 22px;
  background: var(--color-line-strong);
  flex-shrink: 0;
  margin: 0 4px;
}

.cost-filters {
  display: flex;
  gap: 3px;
}

.cost-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: var(--color-raised);
  color: var(--color-ink-muted);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cost-btn:hover {
  border-color: #c9960f;
  color: var(--color-gold-bright);
  background: rgba(184, 134, 11, 0.15);
}

.cost-btn.active {
  border-color: #e0ad25;
  background: rgba(212, 160, 23, 0.26);
  color: #ffd866;
  box-shadow: 0 0 8px rgba(212, 160, 23, 0.4);
}

.type-filters {
  display: flex;
  gap: 4px;
}

.type-pill {
  padding: 4px 11px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: var(--color-raised);
  color: var(--color-ink-muted);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.type-pill:hover {
  border-color: #7d6a52;
  color: var(--color-ink);
}

.type-pill.active {
  border-color: #b8924a;
  background: rgba(160, 128, 64, 0.24);
  color: var(--color-gold-bright);
}

.filter-select {
  padding: 4px 8px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: var(--color-raised);
  color: var(--color-ink-muted);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  cursor: pointer;
  outline: none;
  transition: all 0.15s;
}
.filter-select:hover { border-color: #7d6a52; color: var(--color-ink); }
.filter-select:focus-visible { border-color: #9c876b; }
.filter-select.active {
  border-color: #b8924a;
  background: rgba(160, 128, 64, 0.24);
  color: var(--color-gold-bright);
}
.filter-select option { background: #1d1812; color: var(--color-ink); }

.type-select { display: none; }

.search-wrap {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-raised);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-ui);
  padding: 5px 14px;
  transition: border-color 0.15s;
}

.search-wrap:focus-within {
  border-color: #9c876b;
}

.search-icon {
  width: 13px;
  height: 13px;
  color: var(--color-ink-muted);
  flex-shrink: 0;
}

.search-input {
  background: none;
  border: none;
  outline: none;
  color: var(--color-ink);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 15px;
  width: 150px;
  min-width: 0;
  letter-spacing: 0.03em;
}

.search-input::placeholder {
  color: var(--color-ink-faint);
}

/* Compact: one row, type select, search takes the remaining width */
@container bottombar (max-width: 720px) {
  .type-filters { display: none; }
  .type-select { display: block; }
}
@media (max-height: 560px) {
  .bottom-bar {
    padding: 6px 12px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .bottom-bar::-webkit-scrollbar { display: none; }
  .type-filters { display: none; }
  .type-select { display: block; }
  .cost-filters { gap: 2px; }
  .divider { margin: 0 2px; }
  .filter-select { max-width: 104px; }
  .search-wrap {
    flex: 1;
    min-width: 100px;
    padding: 4px 12px;
  }
  .search-input { width: 100%; }
}
</style>
