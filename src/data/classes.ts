import classData from './classes.json'

export interface ClassDef {
  id: string
  label: string
  color: string
  icon: string
}

export const classes: ClassDef[] = classData

export const NEUTRAL_ID = 'Neutral'
export const NEUTRAL_COLOR = '#888888'
export const NEUTRAL_ICON = '/assets/classes/neutral.webp'
export const CLASS_ICON_GLOW = '/assets/classes/glow.webp'

export function getClassDef(id: string): ClassDef | undefined {
  return classes.find(c => c.id === id)
}

export function getClassColor(id: string): string {
  return getClassDef(id)?.color ?? '#444444'
}

export function getClassIcon(id: string): string {
  return getClassDef(id)?.icon ?? NEUTRAL_ICON
}

// Port of Unity's TeamColors

type Rgb = [number, number, number]

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function rgbToHex([r, g, b]: Rgb): string {
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// h, s, v in 0..1 like Unity's Color.RGBToHSV
function rgbToHsv([r, g, b]: Rgb): Rgb {
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
    if (h < 0) h += 1
  }
  return [h, max === 0 ? 0 : d / max, max]
}

function hsvToRgb(h: number, s: number, v: number): Rgb {
  const i = Math.floor(h * 6) % 6
  const f = h * 6 - Math.floor(h * 6)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const table: Rgb[] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]]
  return table[i] ?? [v, v, v]
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Very dark class colors are lifted to a steel grey keeping their hue.
const HALO_MIN_VALUE = 0.4
const HALO_STEEL_VALUE = 0.72
const HALO_STEEL_SAT = 0.18

export function haloColor(color: string): string {
  const [h, s, v] = rgbToHsv(hexToRgb(color))
  if (v >= HALO_MIN_VALUE) return color
  return rgbToHex(hsvToRgb(h, Math.min(s, HALO_STEEL_SAT), HALO_STEEL_VALUE))
}

const FRAME_SAT_KEEP = 0.5
const FRAME_SAT_MIN = 0.26
const FRAME_VAL_DARK = 0.8
const FRAME_VAL_PALE = 1.0
const FRAME_VAL_DARKEST = 0.6
const FRAME_DARK_FROM = 0.7

export function frameTint(color: string): string {
  const [h, s, v] = rgbToHsv(hexToRgb(color))
  const paleness = v * (1 - s)
  const sat = Math.max(s * FRAME_SAT_KEEP, Math.min(FRAME_SAT_MIN, s))
  const val = lerp(FRAME_VAL_DARK, FRAME_VAL_PALE, paleness) * lerp(FRAME_VAL_DARKEST, 1, clamp01(v / FRAME_DARK_FROM))
  return rgbToHex(hsvToRgb(h, sat, val))
}

export function classAccent(id: string): string {
  return id === NEUTRAL_ID ? NEUTRAL_COLOR : haloColor(getClassColor(id))
}
