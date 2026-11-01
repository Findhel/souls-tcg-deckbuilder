<script setup lang="ts">
import { computed } from 'vue'
import { classes, classAccent, NEUTRAL_ICON, NEUTRAL_ID } from '@/data/classes'
import { useFilters } from '@/composables/useFilters'
import { useDeck, DECK_SIZE } from '@/composables/useDeck'
import { useLang } from '@/composables/useLang'
import { useLayout } from '@/composables/useLayout'

const { selectedClass, currentViewClass, toggleClass } = useFilters()
const { deckActive, deckClass, totalCount } = useDeck()
const { lang, setLang, t } = useLang()
const { panelOpen, togglePanel } = useLayout()

const visibleClasses = computed(() =>
  deckActive.value && deckClass.value ? classes.filter(c => c.id === deckClass.value) : classes
)
const classButtons = computed(() => [
  ...visibleClasses.value,
  { id: NEUTRAL_ID, label: t('Neutral', 'Neutre'), icon: NEUTRAL_ICON },
])
const highlighted = computed(() => selectedClass.value ?? currentViewClass.value)
</script>

<template>
  <div class="filter-bar">
    <div class="classes-row">
      <button
        v-for="cls in classButtons"
        :key="cls.id"
        class="class-medal"
        :class="{ active: highlighted === cls.id }"
        :style="{ '--cls-color': classAccent(cls.id) }"
        :title="cls.label"
        @click="toggleClass(cls.id)"
      >
        <span class="class-ring">
          <img class="class-icon" :src="cls.icon" alt="" />
        </span>
        <span class="class-label">{{ cls.label }}</span>
      </button>
    </div>

    <div class="bar-end">
      <div class="lang-toggle" role="group" :aria-label="t('Language', 'Langue')">
        <button :class="{ on: lang === 'en' }" @click="setLang('en')">EN</button>
        <span class="lang-sep">|</span>
        <button :class="{ on: lang === 'fr' }" @click="setLang('fr')">FR</button>
      </div>

      <button
        class="panel-toggle"
        :class="{ on: panelOpen, full: deckActive && totalCount >= DECK_SIZE }"
        :aria-expanded="panelOpen"
        :title="panelOpen ? t('Hide the deck panel', 'Masquer le panneau des decks') : t('Show the deck panel', 'Afficher le panneau des decks')"
        @click="togglePanel"
      >
        <svg class="panel-toggle-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" stroke-width="1.5" />
          <path d="M12 4v12" stroke="currentColor" stroke-width="1.5" />
          <rect v-if="panelOpen" x="12" y="4" width="5" height="12" rx="1" fill="currentColor" />
        </svg>
        <span>{{ deckActive ? `${totalCount}/${DECK_SIZE}` : t('Decks', 'Decks') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  container: filterbar / inline-size;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-bar);
  border-bottom: 1px solid var(--color-line);
  padding: 10px 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.classes-row {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}

.class-medal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  /* fixed width per breakpoint, sized to the longest name */
  width: 128px;
  padding: 2px 4px 0;
  border: none;
  background: none;
  color: var(--color-ink-muted);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.03em;
  line-height: 1.15;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.18s ease;
}
.class-ring {
  position: relative;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}
.class-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: grayscale(0.55) brightness(0.75);
  transition: filter 0.18s ease, transform 0.18s ease;
}
.class-ring::after {
  content: '';
  position: absolute;
  inset: -9%;
  background: var(--cls-color);
  -webkit-mask: url('/assets/classes/glow.webp') center / 100% 100% no-repeat;
  mask: url('/assets/classes/glow.webp') center / 100% 100% no-repeat;
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: none;
}
.class-label {
  max-width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.class-medal:hover { color: var(--color-ink); }
.class-medal:hover .class-icon { filter: none; }
.class-medal:hover .class-ring::after { opacity: 0.45; }

.class-medal.active { color: color-mix(in srgb, var(--cls-color) 35%, white); }
.class-medal.active .class-icon { filter: none; }
.class-medal.active .class-ring::after { opacity: 1; }

.bar-end {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.lang-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.06em;
}
.lang-toggle button {
  background: none;
  border: none;
  padding: 2px 2px;
  color: var(--color-ink-muted);
  cursor: pointer;
  transition: color 0.15s;
}
.lang-toggle button:hover { color: var(--color-ink); }
.lang-toggle button.on { color: var(--color-gold-bright); }
.lang-sep { color: var(--color-line-strong); }

.panel-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 9px;
  border-radius: var(--radius-ui);
  border: 1px solid var(--color-line-strong);
  background: var(--color-raised);
  color: var(--color-ink-soft);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}
.panel-toggle:hover {
  border-color: #7d6a52;
  color: var(--color-ink);
}
.panel-toggle.on {
  border-color: #8a7444;
  color: var(--color-gold);
}
.panel-toggle.full {
  color: var(--color-gold-bright);
}
.panel-toggle-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@container filterbar (max-width: 1223px) {
  .class-medal { width: 100px; font-size: 12px; }
  .class-label { white-space: normal; }
}
@container filterbar (max-width: 999px) {
  .classes-row {
    overflow-x: auto;
    scrollbar-width: none;
    /* fade the clipped medallions at the right edge */
    mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
  }
  .classes-row::-webkit-scrollbar { display: none; }
  .class-medal { width: 96px; }
  .class-ring { width: 44px; height: 44px; }
}
@media (max-height: 560px) {
  .filter-bar { padding: 6px 12px; }
  .classes-row {
    overflow-x: auto;
    scrollbar-width: none;
    padding: 4px 6px;
    margin: -4px -6px;
  }
  .classes-row::-webkit-scrollbar { display: none; }
  .class-medal { width: 40px; padding: 0; }
  .class-label { display: none; }
  .class-ring { width: 30px; height: 30px; }
}
</style>
