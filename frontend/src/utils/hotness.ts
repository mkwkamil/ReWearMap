export function hotnessLevel(value: number): 'cold' | 'warm' | 'hot' | 'fire' {
  if (value >= 9) return 'fire'
  if (value >= 7) return 'hot'
  if (value >= 4) return 'warm'
  return 'cold'
}

export const unverifiedStyles = {
  badge: 'bg-neutral-500/15 text-[color:var(--muted-light)] ring-neutral-500/30',
  bar: 'bg-neutral-500',
  card: 'border-[color:var(--border-strong)] bg-[color:var(--surface)]',
  marker: { fill: '#737373', stroke: '#a3a3a3' },
}

export function hotnessStyles(value: number) {
  const level = hotnessLevel(value)
  switch (level) {
    case 'fire':
      return {
        badge: 'bg-red-500/15 text-red-500 ring-red-500/30',
        bar: 'bg-red-500',
        card: 'border-red-500/30 bg-[color:var(--surface)]',
        marker: { fill: '#ef4444', stroke: '#fca5a5' },
      }
    case 'hot':
      return {
        badge: 'bg-orange-500/15 text-orange-500 ring-orange-500/30',
        bar: 'bg-orange-500',
        card: 'border-orange-500/30 bg-[color:var(--surface)]',
        marker: { fill: '#f97316', stroke: '#fdba74' },
      }
    case 'warm':
      return {
        badge: 'bg-amber-500/15 text-amber-600 ring-amber-500/30',
        bar: 'bg-amber-500',
        card: 'border-amber-500/30 bg-[color:var(--surface)]',
        marker: { fill: '#f59e0b', stroke: '#fcd34d' },
      }
    default:
      return {
        badge: 'bg-slate-500/15 text-slate-500 ring-slate-500/30',
        bar: 'bg-slate-500',
        card: 'border-[color:var(--border-strong)] bg-[color:var(--surface)]',
        marker: { fill: '#64748b', stroke: '#94a3b8' },
      }
  }
}

export function hotnessLabel(value: number): string {
  const level = hotnessLevel(value)
  switch (level) {
    case 'fire':
      return 'Must visit'
    case 'hot':
      return 'Warto jechać'
    case 'warm':
      return 'Może być'
    default:
      return 'Niski priorytet'
  }
}
