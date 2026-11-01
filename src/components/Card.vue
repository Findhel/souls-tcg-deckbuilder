<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CardVisual, Rarity } from '@/composables/useCards'
import { useLang } from '@/composables/useLang'
import { getClassDef, frameTint } from '@/data/classes'

// Positions come from the Unity hand card prefabs (HandCardMinion / Spell / Weapon).

const props = defineProps<{ card: CardVisual; scale?: number; count?: number }>()
const { lang } = useLang()

const isMinion = computed(() => props.card.type === 'minion')
const isWeapon = computed(() => props.card.type === 'weapon')
// The HP slot also shows weapon durability and terrain duration
const showAtk = computed(() => isMinion.value || isWeapon.value)
const showHp = computed(() => isMinion.value || isWeapon.value || props.card.type === 'terrain')
const showSouls = computed(() => isMinion.value && props.card.runes > 0)

const texts = computed(() => props.card[lang.value])

const GEMS: Record<Rarity, string> = {
  Base: '/assets/ui/gem_base.webp',
  Common: '/assets/ui/gem_common.webp',
  Rare: '/assets/ui/gem_rare.webp',
  Epic: '/assets/ui/gem_epic.webp',
  Legendary: '/assets/ui/gem_legendary.webp',
}
const gem = computed(() => GEMS[props.card.rarity] ?? GEMS.Common)

// Dual-class: primary on the left, secondary on the right
const tintPrimary = computed(() => {
  const def = getClassDef(props.card.class_primary)
  return def ? frameTint(def.color) : null
})
const tintSecondary = computed(() => {
  if (!tintPrimary.value || props.card.class_secondary === props.card.class_primary) return null
  const def = getClassDef(props.card.class_secondary)
  return def ? frameTint(def.color) : null
})

// Largest font size that fits the box
const titleRef = ref<HTMLElement>()
const textRef = ref<HTMLElement>()
const tagsRef = ref<HTMLElement>()

function fit(el: HTMLElement | undefined, max: number, min: number, overflows: (el: HTMLElement) => boolean) {
  if (!el) return
  let size = max
  el.style.fontSize = `${size}px`
  while (overflows(el) && size > min) {
    size -= 0.5
    el.style.fontSize = `${size}px`
  }
}

function fitAll() {
  fit(titleRef.value, 11.5, 7, el => el.scrollWidth > el.clientWidth)
  fit(textRef.value, 12, 7.5, el => el.scrollHeight > el.clientHeight)
  fit(tagsRef.value, 8, 6, el => el.scrollWidth > el.clientWidth)
}

onMounted(fitAll)
watch(texts, fitAll, { flush: 'post' })
</script>

<template>
  <div
    class="card"
    :class="isMinion ? 'k-minion' : 'k-spell'"
    :style="scale ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined"
  >
    <div v-if="isMinion" class="c-art-window">
      <div class="c-art" :style="{ backgroundImage: `url(${card.image})` }" />
      <div class="c-art-shadow" />
    </div>
    <div v-else class="c-art" :style="{ backgroundImage: `url(${card.image})` }" />

    <div class="c-frame" />
    <div
      v-if="tintPrimary"
      class="c-tint"
      :class="tintSecondary ? 'c-tint--left' : 'c-tint--full'"
      :style="{ backgroundColor: tintPrimary }"
    />
    <div v-if="tintSecondary" class="c-tint c-tint--right" :style="{ backgroundColor: tintSecondary }" />
    <div v-if="card.rarity === 'Legendary'" class="c-legendary" />

    <div class="c-cost-icon" />
    <div v-if="showAtk" class="c-atk-icon" />
    <div v-if="showHp" class="c-hp-icon" :class="{ shield: isWeapon }" />

    <span class="c-num c-cost">{{ card.cost }}</span>
    <span v-if="showAtk" class="c-num c-atk">{{ card.atk }}</span>
    <span v-if="showHp" class="c-num c-hp">{{ card.hp }}</span>

    <div class="c-title-bg" />
    <div class="c-title"><span ref="titleRef" class="c-title-text">{{ texts.name }}</span></div>
    <div class="c-gem" :style="{ backgroundImage: `url(${gem})` }" />

    <div ref="textRef" class="c-text">{{ texts.text }}</div>

    <div v-if="showSouls" class="c-souls">
      <span class="c-souls-icon" />
      <span class="c-souls-num">{{ card.runes }}</span>
    </div>

    <div
      v-if="texts.banner"
      ref="tagsRef"
      class="c-tags"
      :class="{ 'c-tags--between-stats': showAtk || showHp }"
    >{{ texts.banner }}</div>

    <div v-if="count" class="c-count">{{ count }}</div>
  </div>
</template>

<style scoped>
/* Card space 250×350, top-left origin, converted from the Unity prefab rects */

.card {
  width: 250px;
  height: 350px;
  position: relative;
  overflow: visible;
  flex-shrink: 0;
  isolation: isolate; /* keeps the tint's multiply blend inside the card */
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 400;
}

.card > * {
  position: absolute;
}

/* art */
.c-art {
  background-repeat: no-repeat;
  background-color: #1a1a1a;
}

/* spell visual: Image "Sprite" 223.9×195.1, stretched (preserveAspect off) */
.k-spell > .c-art {
  left: 13.1px; top: 30.7px; width: 223.9px; height: 195.1px;
  background-size: 100% 100%;
}

/* minion visual: ArtMask (card_minion_maskv2, preserveAspect) fitted in 211.1×233 */
.c-art-window {
  left: 32.41px; top: 2.5px; width: 186.88px; height: 233px;
  -webkit-mask: url('/assets/ui/minion_art_mask.webp') 0 0 / 100% 100% no-repeat;
  mask: url('/assets/ui/minion_art_mask.webp') 0 0 / 100% 100% no-repeat;
}
/* art image 240×233 (preserveAspect = contain), centred like the prefab */
.c-art-window > .c-art {
  position: absolute;
  left: -26.61px; top: 0; width: 240px; height: 233px;
  background-size: contain;
  background-position: center;
  background-color: transparent;
}
.c-art-shadow {
  position: absolute; inset: 0;
  background: url('/assets/ui/minion_art_shadow.webp') 0 0 / 100% 100% no-repeat;
}

/* frame + class tint */
.c-frame,
.c-tint,
.c-legendary {
  left: 0; width: 250px;
  pointer-events: none;
}
.c-frame,
.c-legendary { background: 0 0 / 100% 100% no-repeat; }
.k-minion .c-frame,
.k-minion .c-tint,
.k-minion .c-legendary { top: 1.68px; height: 346.64px; }
.k-spell .c-frame,
.k-spell .c-tint,
.k-spell .c-legendary { top: 2.29px; height: 345.43px; }
.k-minion .c-frame { background-image: url('/assets/ui/frame_minion.webp'); }
.k-spell .c-frame { background-image: url('/assets/ui/frame_spell.webp'); }
.k-minion .c-legendary { background-image: url('/assets/ui/legendary_minion.webp'); }
.k-spell .c-legendary { background-image: url('/assets/ui/legendary_spell.webp'); }

.c-tint {
  mix-blend-mode: multiply;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
.k-minion .c-tint--full { -webkit-mask-image: url('/assets/ui/tint_minion.webp'); mask-image: url('/assets/ui/tint_minion.webp'); }
.k-minion .c-tint--left { -webkit-mask-image: url('/assets/ui/tint_minion_left.webp'); mask-image: url('/assets/ui/tint_minion_left.webp'); }
.k-minion .c-tint--right { -webkit-mask-image: url('/assets/ui/tint_minion_right.webp'); mask-image: url('/assets/ui/tint_minion_right.webp'); }
.k-spell .c-tint--full { -webkit-mask-image: url('/assets/ui/tint_spell.webp'); mask-image: url('/assets/ui/tint_spell.webp'); }
.k-spell .c-tint--left { -webkit-mask-image: url('/assets/ui/tint_spell_left.webp'); mask-image: url('/assets/ui/tint_spell_left.webp'); }
.k-spell .c-tint--right { -webkit-mask-image: url('/assets/ui/tint_spell_right.webp'); mask-image: url('/assets/ui/tint_spell_right.webp'); }

/* stats */
.c-cost-icon,
.c-atk-icon,
.c-hp-icon {
  background: 0 0 / 100% 100% no-repeat;
}
.c-cost-icon { left: -6.8px; top: -10px; width: 60px; height: 60px; background-image: url('/assets/ui/rune.webp'); }
.c-atk-icon { left: 5px; top: 303px; width: 50px; height: 50px; background-image: url('/assets/ui/attack.webp'); }
.c-hp-icon { left: 195px; top: 303px; width: 50px; height: 50px; background-image: url('/assets/ui/hp.webp'); }
.c-hp-icon.shield { background-image: url('/assets/ui/shield.webp'); }

.c-num {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #fff;
  line-height: 1;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 1px 1px 0 rgba(0, 0, 0, 0.5);
}
.c-cost { left: -4.4px; top: -5px; width: 54.7px; height: 49.9px; font-size: 24px; }
.c-atk { top: 303px; height: 49.9px; font-size: 23px; }
.k-minion .c-atk { left: 9.3px; width: 41.4px; }
.k-spell .c-atk { left: 2.6px; width: 54.7px; }
.c-hp { left: 192.6px; top: 303px; width: 54.7px; height: 49.9px; font-size: 23px; }

/* title banner */
.c-title-bg { background: url('/assets/ui/card_title.webp') 0 0 / 100% 100% no-repeat; }
.k-minion .c-title-bg { left: 12.5px; top: 200.5px; width: 225px; height: 30px; }
.k-spell .c-title-bg { left: 7.5px; top: 188.6px; width: 235px; height: 34.8px; }

.c-title {
  display: flex;
  align-items: center;
  justify-content: center;
}
.k-minion .c-title { left: 24px; top: 202px; width: 202px; height: 28px; }
.k-spell .c-title { left: 22px; top: 191px; width: 206px; height: 30px; }
.c-title-text {
  max-width: 100%;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #f5e6c8;
  white-space: nowrap;
  overflow: hidden;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.c-gem {
  background: center / contain no-repeat;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}
.k-minion .c-gem { left: 112.5px; top: 226.7px; width: 25px; height: 25px; }
.k-spell .c-gem { left: 112.9px; top: 218.3px; width: 24.1px; height: 24.1px; }

/* effect text */
.c-text {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.4;
  font-weight: 600;
  color: #111;
  text-align: center;
  white-space: pre-line;
  overflow: hidden;
}
.k-minion .c-text { left: 22.7px; top: 247px; width: 205px; height: 62px; }
.k-spell .c-text { left: 16px; top: 238px; width: 218px; height: 62px; }

/* souls badge */
.c-souls {
  left: 184px; top: 11px; width: 60px; height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.c-souls-icon {
  width: 12px; height: 12px;
  flex-shrink: 0;
  background: url('/assets/ui/rune.webp') 0 0 / 100% 100% no-repeat;
}
.c-souls-num {
  font-size: 11.5px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  text-shadow: 1.5px 1.5px 0 rgba(0, 0, 0, 0.8);
}

/* tribe / school tags */
.c-tags {
  top: 322px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 206px; /* parchment width */
  background: rgba(180, 160, 120, 0.45);
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* between the ATK / HP discs */
.c-tags--between-stats {
  max-width: 136px;
}

/* deck count badge */
.c-count {
  top: -6px; right: -6px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #eab308;
  color: #000;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  z-index: 10;
}
</style>
