import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { ThriftStore } from '../api/client'
import Toggle from './Toggle'
import { formatDeliveryDate } from '../utils/dates'
import {
  FREQUENCY_OPTIONS,
  frequencyFromIndex,
  frequencyIndex,
  formatFrequencyLabel,
  hasAutoSchedule,
  parseFrequencyCode,
  type FrequencyCode,
} from '../utils/frequency'
import { hotnessLabel, hotnessStyles } from '../utils/hotness'
import { defaultDeliveryTime } from '../utils/time'

type SavePayload = {
  name: string
  lat: number
  lng: number
  next_delivery: string | null
  delivery_enabled: boolean
  delivery_verified: boolean
  delivery_frequency: string
  hotness: number
  notes: string
  opening_time: string
  delivery_time: string
  facebook_url: string
  instagram_url: string
}

type Props = {
  initial: ThriftStore | null
  onClose: () => void
  onSave: (payload: SavePayload) => Promise<void>
}

export default function StoreModal({ initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [lat, setLat] = useState(initial?.lat?.toString() ?? '52.2297')
  const [lng, setLng] = useState(initial?.lng?.toString() ?? '21.0122')
  const [deliveryEnabled, setDeliveryEnabled] = useState(
    initial ? initial.delivery_enabled : false,
  )
  const [notVerified, setNotVerified] = useState(initial ? !initial.delivery_verified : true)
  const [nextDelivery, setNextDelivery] = useState(initial?.next_delivery ?? '')
  const [freqIndex, setFreqIndex] = useState(() =>
    frequencyIndex(parseFrequencyCode(initial?.delivery_frequency ?? '2w')),
  )
  const [hotness, setHotness] = useState(initial?.hotness ?? 5)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [deliveryTime, setDeliveryTime] = useState(initial?.delivery_time || defaultDeliveryTime())
  const [facebookUrl, setFacebookUrl] = useState(initial?.facebook_url ?? '')
  const [instagramUrl, setInstagramUrl] = useState(initial?.instagram_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const frequencyCode = frequencyFromIndex(freqIndex) as FrequencyCode
  const frequencyLabel = formatFrequencyLabel(frequencyCode)
  const styles = hotnessStyles(hotness)
  const scheduleActive = !notVerified

  function handleNotVerifiedChange(checked: boolean) {
    setNotVerified(checked)
    if (checked) setDeliveryEnabled(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const latNum = Number(lat)
    const lngNum = Number(lng)
    if (!name.trim() || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError('Podaj nazwę oraz poprawne koordynaty.')
      return
    }

    const verified = !notVerified
    let nextDeliveryIso: string | null = null
    if (verified && deliveryEnabled && nextDelivery) {
      nextDeliveryIso = nextDelivery
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        lat: latNum,
        lng: lngNum,
        next_delivery: nextDeliveryIso,
        delivery_enabled: verified && deliveryEnabled,
        delivery_verified: verified,
        delivery_frequency: verified ? frequencyCode : 'none',
        hotness: verified ? hotness : 5,
        notes: notes.trim(),
        opening_time: '',
        delivery_time: verified && deliveryEnabled ? deliveryTime : defaultDeliveryTime(),
        facebook_url: facebookUrl.trim(),
        instagram_url: instagramUrl.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zapis nieudany')
      setSaving(false)
      return
    }
    setSaving(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Zamknij"
        className="absolute inset-0 bg-[color:var(--overlay)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] shadow-2xl"
      >
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">{initial ? 'Edytuj lumpeks' : 'Nowy lumpeks'}</h2>
              <p className="mt-0.5 text-sm text-[color:var(--muted)]">Nazwa, GPS, harmonogram i notatka.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--ink)]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-[color:var(--danger)]">{error}</p>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Nazwa sklepu</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Lumpeks na Mokotowie"
              className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Szerokość (Lat)</span>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm font-mono text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Długość (Lng)</span>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm font-mono text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
              />
            </label>
          </div>

          <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Weryfikacja</span>
                <p className="mt-0.5 text-sm text-[color:var(--muted-light)]">
                  {notVerified ? 'Jeszcze nie sprawdzony' : 'Harmonogram zweryfikowany'}
                </p>
              </div>
              <Toggle checked={notVerified} onChange={handleNotVerifiedChange} label="Nie sprawdzony" />
            </div>

            {scheduleActive && (
              <>
            <div className="border-t border-[color:var(--border)] pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Częstotliwość dostaw</span>
                  <p className="mt-0.5 text-sm text-[color:var(--muted-light)]">{frequencyLabel}</p>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={FREQUENCY_OPTIONS.length - 1}
                step={1}
                value={freqIndex}
                onChange={(e) => setFreqIndex(Number(e.target.value))}
                className="mt-3 w-full accent-[color:var(--accent)]"
              />
              <div className="mt-2 flex justify-between gap-1 text-[10px] text-[color:var(--muted)]">
                {FREQUENCY_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setFreqIndex(i)}
                    className={`flex-1 truncate text-center transition ${
                      i === freqIndex ? 'font-semibold text-[color:var(--accent)]' : 'hover:text-[color:var(--muted-light)]'
                    }`}
                  >
                    {opt.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[color:var(--border)] pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">
                  Termin następnej dostawy
                </span>
                <Toggle
                  checked={deliveryEnabled}
                  onChange={setDeliveryEnabled}
                  label={deliveryEnabled ? 'Włączone' : 'Wyłączone'}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] text-[color:var(--muted)]">Data</span>
                  <input
                    type="date"
                    value={nextDelivery}
                    onChange={(e) => setNextDelivery(e.target.value)}
                    disabled={!deliveryEnabled}
                    className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]  disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] text-[color:var(--muted)]">Godzina dostawy</span>
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    disabled={!deliveryEnabled}
                    className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]  disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </label>
              </div>
              {deliveryEnabled && nextDelivery && (
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Wybrano: {formatDeliveryDate(nextDelivery)}
                </p>
              )}
              {deliveryEnabled && hasAutoSchedule(frequencyCode) && (
                <p className="mt-1.5 text-xs text-[color:var(--muted)]">
                  Po minięciu daty termin przesunie się automatycznie ({frequencyLabel.toLowerCase()}).
                </p>
              )}
            </div>
              </>
            )}

            {!scheduleActive && (
              <p className="border-t border-[color:var(--border)] pt-3 text-xs text-[color:var(--muted)]">
                Oznacz jako zweryfikowany, że ustawić gorącość, harmonogram i termin dostawy.
              </p>
            )}
          </div>

          {scheduleActive && (
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Hotness</span>
                <p className="mt-0.5 text-sm text-[color:var(--muted-light)]">{hotnessLabel(hotness)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${styles.badge}`}>★ {hotness}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={hotness}
              onChange={(e) => setHotness(Number(e.target.value))}
              className="mt-3 w-full accent-[color:var(--accent)]"
            />
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--track)]">
              <div className={`h-full rounded-full transition-all ${styles.bar}`} style={{ width: `${hotness * 10}%` }} />
            </div>
          </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Notatka</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. duży wybór kurtek, kasy tylko gotówka, parking z tyłu…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
            />
          </label>

          <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)] p-4">
            <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Kontakt</span>
            <label className="block space-y-1.5">
              <span className="text-xs text-[color:var(--muted-light)]">Facebook</span>
              <input
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="np. nazwa strony lub pełny link"
                className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-[color:var(--muted-light)]">Instagram</span>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="np. @profil lub pełny link"
                className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 border-t border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[color:var(--border-strong)] px-3 py-2.5 text-sm text-[color:var(--muted-light)] transition hover:text-[color:var(--ink)]"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-[color:var(--accent)] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? 'Zapisywanie…' : initial ? 'Zapisz zmiany' : 'Dodaj sklep'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
