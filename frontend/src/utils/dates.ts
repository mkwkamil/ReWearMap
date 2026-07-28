import type { ThriftStore } from '../api/client'
import { hasAutoSchedule, parseFrequencyCode } from './frequency'

/** ISO (yyyy-mm-dd) → dd.mm.rrrr */
export function formatDeliveryDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`
}

/** ISO → dd.mm.rrrr for input fields */
export function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return ''
  const formatted = formatDeliveryDate(iso)
  return formatted === '—' ? '' : formatted
}

/** dd.mm.rrrr → ISO yyyy-mm-dd or null if invalid/empty */
export function parseDisplayDate(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const probe = new Date(year, month - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function deliveryStatusLabel(store: ThriftStore): string {
  if (!store.delivery_enabled) return 'Wyłączone'
  if (!store.delivery_verified) return 'Nie sprawdzony'
  if (!store.next_delivery) return 'Brak daty'
  return formatDeliveryDate(effectiveNextDelivery(store))
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const FREQUENCY_DAYS: Record<string, number | null> = {
  '3d': 3,
  '1w': 7,
  '2w': 14,
  '3w': 21,
  '4w': 28,
  none: null,
}

function frequencyDays(frequency: string): number | null {
  const code = parseFrequencyCode(frequency)
  return FREQUENCY_DAYS[code] ?? null
}

/** Advance past delivery dates using the store frequency (mirrors backend logic). */
export function advanceNextDelivery(
  iso: string,
  frequency: string,
  today: Date = startOfToday(),
): string {
  const step = frequencyDays(frequency)
  if (step === null) return iso

  let current = parseLocalDate(iso)
  let guard = 0
  while (current < today && guard < 520) {
    current = new Date(current)
    current.setDate(current.getDate() + step)
    guard += 1
  }
  return toIsoDate(current)
}

/** Next delivery date as it should appear in the UI right now. */
export function effectiveNextDelivery(store: ThriftStore): string | null {
  if (!store.next_delivery) return null
  if (!store.delivery_enabled || !store.delivery_verified) return store.next_delivery
  if (!hasAutoSchedule(parseFrequencyCode(store.delivery_frequency))) return store.next_delivery
  return advanceNextDelivery(store.next_delivery, store.delivery_frequency)
}

function deliveryIntervalDays(store: ThriftStore): number | null {
  const code = parseFrequencyCode(store.delivery_frequency)
  switch (code) {
    case '3d':
      return 3
    case '1w':
      return 7
    case '2w':
      return 14
    case '3w':
      return 21
    case '4w':
      return 28
    default:
      return null
  }
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const target = parseLocalDate(iso)
  const today = startOfToday()
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/** Human-readable relative delivery label in Polish. */
export function formatRelativeDeliveryDays(days: number): string {
  if (days === 0) return 'Dziś'
  if (days === 1) return 'Jutro'
  if (days === -1) return '1 dzień temu'
  if (days < 0) return `${Math.abs(days)} dni temu`
  return `za ${days} dni`
}

/**
 * Relative label for the delivery badge.
 * Defaults to "days until next delivery", but on the first day after a delivery
 * it shows "1 dzień temu" so overdue entries are easier to spot.
 */
export function deliveryRelativeLabel(store: ThriftStore): string {
  const nextDelivery = effectiveNextDelivery(store)
  if (!nextDelivery) return '—'

  const days = daysUntil(nextDelivery)
  if (days === null) return formatDeliveryDate(nextDelivery)

  const interval = deliveryIntervalDays(store)
  if (interval !== null && days === interval - 1) {
    return '1 dzień temu'
  }

  return formatRelativeDeliveryDays(days)
}
