/** Normalize social input to a full URL for links. */
export function socialLink(kind: 'facebook' | 'instagram', raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const handle = trimmed.replace(/^@/, '')
  if (kind === 'facebook') {
    if (handle.includes('facebook.com')) return `https://${handle.replace(/^https?:\/\//, '')}`
    return `https://facebook.com/${handle}`
  }
  if (handle.includes('instagram.com')) return `https://${handle.replace(/^https?:\/\//, '')}`
  return `https://instagram.com/${handle}`
}

export function socialLabel(_kind: 'facebook' | 'instagram', raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      const path = url.pathname.replace(/^\//, '')
      return path || url.hostname
    } catch {
      return trimmed
    }
  }
  return trimmed.replace(/^@/, '')
}
