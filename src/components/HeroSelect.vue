<script setup lang="ts">
import { heroes } from '@/data/heroes'
import { classAccent } from '@/data/classes'
import { useDeck } from '@/composables/useDeck'
import { useLang } from '@/composables/useLang'

const { hero: selectedHero, setHero } = useDeck()
const { lang } = useLang()
</script>

<template>
  <div class="flex gap-3 overflow-x-auto px-4 py-3 shrink-0 bg-gray-900 border-b border-gray-800">
    <button
      v-for="hero in heroes"
      :key="hero.id"
      class="flex flex-col items-center gap-1 shrink-0 focus:outline-none"
      @click="setHero(hero)"
    >
      <div
        class="w-16 h-16 rounded-full p-0.5 transition-all"
        :style="{
          background: selectedHero?.id === hero.id
            ? classAccent(hero.class)
            : 'transparent',
        }"
      >
        <div class="w-full h-full rounded-full overflow-hidden bg-gray-700">
          <img
            :src="hero.portrait"
            :alt="hero[lang].name"
            class="w-full h-full object-cover object-top"
          />
        </div>
      </div>
      <span class="text-sm max-w-[64px] text-center leading-tight truncate"
        :class="selectedHero?.id === hero.id ? 'text-white' : 'text-gray-400'"
      >
        {{ hero[lang].name }}
      </span>
    </button>
  </div>
</template>
