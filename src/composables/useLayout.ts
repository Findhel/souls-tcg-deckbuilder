import { ref, computed } from 'vue'
import type { Card } from './useCards'

// Docked panel open state is remembered, the drawer always starts closed.
const DOCKED_OPEN_KEY = 'souls-tcg-panel-open'

function mediaQuery(query: string) {
  const mql = window.matchMedia(query)
  const matches = ref(mql.matches)
  mql.addEventListener('change', e => {
    matches.value = e.matches
  })
  return matches
}

const isDrawer = mediaQuery('(max-width: 1023px)')
const isShort = mediaQuery('(max-height: 560px)')
const canHover = mediaQuery('(hover: hover)')

const viewportW = ref(window.innerWidth)
const viewportH = ref(window.innerHeight)
window.addEventListener('resize', () => {
  viewportW.value = window.innerWidth
  viewportH.value = window.innerHeight
})

function initialDockedOpen(): boolean {
  try {
    return localStorage.getItem(DOCKED_OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

const dockedOpen = ref(initialDockedOpen())
const drawerOpen = ref(false)
const panelOpen = computed(() => (isDrawer.value ? drawerOpen.value : dockedOpen.value))

function setPanelOpen(open: boolean): void {
  if (isDrawer.value) {
    drawerOpen.value = open
    return
  }
  dockedOpen.value = open
  try {
    localStorage.setItem(DOCKED_OPEN_KEY, open ? '1' : '0')
  } catch {
    // storage unavailable
  }
}

function togglePanel(): void {
  setPanelOpen(!panelOpen.value)
}

const zoomedCard = ref<Card | null>(null)

export function useLayout() {
  return { isDrawer, isShort, canHover, viewportW, viewportH, panelOpen, setPanelOpen, togglePanel, zoomedCard }
}
