/** HH:MM (24h) → czytelny format, np. 08:00 → 8:00 */
export function formatTime(value: string | null | undefined): string {
  if (!value?.trim()) return ''
  const [h, m] = value.trim().split(':')
  if (!h || m === undefined) return value
  const hour = Number(h)
  const minute = Number(m)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  return `${hour}:${String(minute).padStart(2, '0')}`
}

export function defaultDeliveryTime(): string {
  return '08:00'
}

export function defaultOpeningTime(): string {
  return '10:00'
}
