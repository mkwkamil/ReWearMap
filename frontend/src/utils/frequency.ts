/** Standardized delivery frequency codes stored in the database. */
export const FREQUENCY_OPTIONS = [
  { code: '3d', label: 'Co 3 dni', short: '3 dni' },
  { code: '1w', label: 'Co tydzień', short: '1 tydz.' },
  { code: '2w', label: 'Co 2 tygodnie', short: '2 tyg.' },
  { code: '3w', label: 'Co 3 tygodnie', short: '3 tyg.' },
  { code: '4w', label: 'Co 4 tygodnie', short: '4 tyg.' },
  { code: 'none', label: 'Nieokreślone', short: '—' },
] as const

export type FrequencyCode = (typeof FREQUENCY_OPTIONS)[number]['code']

const LEGACY_MAP: Record<string, FrequencyCode> = {
  'co 3 dni': '3d',
  'co tydzień': '1w',
  'co tydzien': '1w',
  'co 2 tygodnie': '2w',
  'co 3 tygodnie': '3w',
  'co 4 tygodnie': '4w',
  'co miesiąc': '4w',
  'co miesiac': '4w',
  nieokreślone: 'none',
  nieokreslone: 'none',
  '': 'none',
}

export function parseFrequencyCode(raw: string): FrequencyCode {
  const normalized = raw.trim().toLowerCase()
  const known = FREQUENCY_OPTIONS.find((o) => o.code === normalized)
  if (known) return known.code
  return LEGACY_MAP[normalized] ?? '2w'
}

export function frequencyIndex(code: FrequencyCode): number {
  const idx = FREQUENCY_OPTIONS.findIndex((o) => o.code === code)
  return idx >= 0 ? idx : 2
}

export function frequencyFromIndex(index: number): FrequencyCode {
  const clamped = Math.max(0, Math.min(FREQUENCY_OPTIONS.length - 1, index))
  return FREQUENCY_OPTIONS[clamped].code
}

export function formatFrequencyLabel(raw: string): string {
  const code = parseFrequencyCode(raw)
  return FREQUENCY_OPTIONS.find((o) => o.code === code)?.label ?? 'Nieokreślone'
}

export function hasAutoSchedule(code: FrequencyCode): boolean {
  return code !== 'none'
}
