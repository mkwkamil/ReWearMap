import type { ThriftStore } from '../api/client'

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
  return formatDeliveryDate(store.next_delivery)
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const target = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}
