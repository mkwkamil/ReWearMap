import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import type { ThriftStore } from '../api/client'
import { daysUntil, effectiveNextDelivery, formatDeliveryDate, formatRelativeDeliveryDays } from '../utils/dates'
import { formatFrequencyLabel } from '../utils/frequency'
import { hotnessLabel, hotnessStyles, unverifiedStyles } from '../utils/hotness'
import { socialLabel, socialLink } from '../utils/social'
import { formatTime } from '../utils/time'

type Props = {
  store: ThriftStore
  isAdmin?: boolean
  onClose: () => void
  onEdit: () => void
  onNavigate: () => void
}

function deliverySummary(store: ThriftStore): string {
  if (!store.delivery_enabled) return 'Termin dostawy wyłączony'
  if (!store.delivery_verified) return 'Harmonogram niezweryfikowany'
  const nextDelivery = effectiveNextDelivery(store)
  if (!nextDelivery) return 'Brak ustawionej daty dostawy'
  const days = daysUntil(nextDelivery)
  const date = formatDeliveryDate(nextDelivery)
  const time = formatTime(store.delivery_time)
  const timePart = time ? ` o ${time}` : ''
  if (days === null) return `${date}${timePart}`
  const rel = formatRelativeDeliveryDays(days).toLowerCase()
  return `${date}${timePart} (${rel})`
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-[color:var(--border)] py-3 last:border-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--muted)]">{label}</p>
      <div className="mt-1 text-sm text-[color:var(--ink)]/90">{children}</div>
    </div>
  )
}

export default function StoreInfoPanel({ store, isAdmin = false, onClose, onEdit, onNavigate }: Props) {
  const unverified = !store.delivery_verified
  const styles = unverified ? unverifiedStyles : hotnessStyles(store.hotness)
  const fb = socialLink('facebook', store.facebook_url)
  const ig = socialLink('instagram', store.instagram_url)
  const note = store.notes?.trim()

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-[color:var(--overlay)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] shadow-2xl">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[color:var(--ink)]">{store.name}</h2>
              {!unverified && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles.badge}`}>
                    ★ {store.hotness}/10 · {hotnessLabel(store.hotness)}
                  </span>
                </div>
              )}
              {unverified && (
                <p className="mt-1 text-xs text-[color:var(--muted)]">Do weryfikacji</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--ink)]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-1">
          <InfoRow label="Najbliższa dostawa">{deliverySummary(store)}</InfoRow>
          <InfoRow label="Częstotliwość">{formatFrequencyLabel(store.delivery_frequency)}</InfoRow>
          {store.delivery_enabled && store.delivery_time && (
            <InfoRow label="Godzina dostawy">{formatTime(store.delivery_time)}</InfoRow>
          )}
          <InfoRow label="Lokalizacja">
            <span className="font-mono text-[color:var(--muted-light)]">
              {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
            </span>
          </InfoRow>
          {(fb || ig) && (
            <InfoRow label="Social media">
              <div className="flex flex-col gap-2">
                {fb && (
                  <a
                    href={fb}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[color:var(--accent)] hover:underline"
                  >
                    Facebook — {socialLabel('facebook', store.facebook_url)}
                  </a>
                )}
                {ig && (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[color:var(--accent)] hover:underline"
                  >
                    Instagram — {socialLabel('instagram', store.instagram_url)}
                  </a>
                )}
              </div>
            </InfoRow>
          )}
          <InfoRow label="Notatka">
            {note ? (
              <p className="whitespace-pre-wrap leading-relaxed text-[color:var(--muted-light)]">„{note}"</p>
            ) : (
              <span className="text-[color:var(--muted)]">—</span>
            )}
          </InfoRow>
        </div>

        <div className="flex gap-2 border-t border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onNavigate}
            className="flex-1 rounded-xl bg-[color:var(--accent)] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-hover)]"
          >
            Nawiguj
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-xl border border-[color:var(--border-strong)] px-3 py-2.5 text-sm text-[color:var(--muted-light)] transition hover:text-[color:var(--ink)]"
            >
              Edytuj
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
