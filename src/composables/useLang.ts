import { ref } from 'vue'

export type Lang = 'en' | 'fr'

const STORAGE_KEY = 'souls-tcg-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    // storage unavailable
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

const lang = ref<Lang>(initialLang())
document.documentElement.lang = lang.value

function setLang(next: Lang): void {
  lang.value = next
  document.documentElement.lang = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // storage unavailable
  }
}

function t(en: string, fr: string): string {
  return lang.value === 'fr' ? fr : en
}

export function useLang() {
  return { lang, setLang, t }
}
