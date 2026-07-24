import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type ThriftStore } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import LoginModal from '../components/LoginModal'
import MapExplorer from '../components/MapExplorer'
import StoreCard from '../components/StoreCard'
import StoreInfoPanel from '../components/StoreInfoPanel'
import StoreModal from '../components/StoreModal'
import { useToast } from '../components/Toast'
import { useTheme } from '../theme/ThemeContext'
import { distanceMeters, type LatLng } from '../utils/geo'
import { filterAndSortStores, type MapFilters } from '../utils/storeFilters'

const PAGE_SIZE = 12

function mapsUrl(lat: number, lng: number) {
  const isApple =
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) || navigator.platform === 'MacIntel')
  if (isApple) {
    return `http://maps.apple.com/?q=${lat},${lng}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

function openNavigation(lat: number, lng: number) {
  window.open(mapsUrl(lat, lng), '_blank', 'noopener,noreferrer')
}

const DEFAULT_FILTERS: MapFilters = {
  query: '',
  districtId: 'all',
  upcomingOnly: false,
  unverifiedOnly: false,
  sortMode: 'hotness',
}

export default function MapPage() {
  const { toast } = useToast()
  const { isAdmin, ready, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [stores, setStores] = useState<ThriftStore[]>([])
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [locateRequestId, setLocateRequestId] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [infoStore, setInfoStore] = useState<ThriftStore | null>(null)
  const [editing, setEditing] = useState<ThriftStore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api.listStores()
      setStores(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać sklepów')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredStores = useMemo(
    () => filterAndSortStores(stores, filters, userLocation),
    [stores, filters, userLocation],
  )

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const pageStores = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredStores.slice(start, start + PAGE_SIZE)
  }, [filteredStores, safePage])

  const handleFiltersChange = useCallback(
    (patch: Partial<MapFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }))
      setPage(1)
      if (patch.sortMode === 'distance' && !userLocation) {
        setLocateRequestId((n) => n + 1)
        toast('Ustalanie lokalizacji…')
      }
    },
    [toast, userLocation],
  )

  const handleUserLocation = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng })
  }, [])

  async function handleSave(payload: {
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
  }) {
    try {
      if (editing) {
        await api.updateStore(editing.id, payload)
        toast(`Zaktualizowano „${payload.name}"`)
      } else {
        await api.createStore(payload)
        toast(`Dodano „${payload.name}"`)
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Zapis nieudany', 'error')
      throw err
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć ten lumpeks?')) return
    setError(null)
    const store = stores.find((s) => s.id === id)
    try {
      await api.deleteStore(id)
      if (selectedId === id) setSelectedId(null)
      await load()
      toast(store ? `Usunięto „${store.name}"` : 'Sklep usunięty')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się usunąć sklepu'
      setError(message)
      toast(message, 'error')
    }
  }

  function openAddModal() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEditModal(store: ThriftStore) {
    setInfoStore(null)
    setEditing(store)
    setModalOpen(true)
  }

  const overlayOpen = modalOpen || infoStore !== null

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-[color:var(--ink)] sm:text-xl">
            ReWearMap
            <span className="ml-1.5 text-sm font-normal text-[color:var(--muted)] sm:ml-2 sm:text-base">
              ({loading ? '…' : stores.length})
            </span>
          </h1>
          <p className="mt-0.5 hidden text-sm text-[color:var(--muted)] sm:block">
            Mapa, filtry i lista — Warszawa, dostawy i priorytet gorąca.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[color:var(--accent)] px-2.5 text-xs font-semibold text-white shadow-[0_0_20px_var(--accent-glow)] transition hover:bg-[color:var(--accent-hover)] sm:h-10 sm:px-3.5 sm:text-sm"
              title="Dodaj lumpeks"
            >
              <PlusIcon />
              <span className="hidden sm:inline">Dodaj</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--muted-light)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--ink)] sm:h-10 sm:w-10"
            aria-label={theme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
            title={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {ready &&
            (isAdmin ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--muted-light)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--ink)] sm:h-10 sm:w-10"
                aria-label="Wyloguj"
                title="Wyloguj"
              >
                <LogoutIcon />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--muted-light)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--ink)] sm:h-10 sm:w-10"
                aria-label="Logowanie admina"
                title="Logowanie"
              >
                <LoginIcon />
              </button>
            ))}
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      )}

      <MapExplorer
        stores={stores}
        filteredStores={filteredStores}
        filters={filters}
        selectedId={selectedId}
        dimmed={overlayOpen}
        mapLoading={loading && stores.length === 0}
        locateRequestId={locateRequestId}
        onFiltersChange={handleFiltersChange}
        onUserLocation={handleUserLocation}
        onSelect={(id) => {
          setSelectedId(id)
          const store = stores.find((s) => s.id === id)
          if (store) setInfoStore(store)
        }}
        onClearSelection={() => setSelectedId(null)}
      />

      <section className="w-full min-w-0 space-y-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <h2 className="min-w-0 text-sm font-semibold uppercase tracking-wide text-[color:var(--muted-light)]">
            Lista sklepów
            {!loading && (
              <span className="ml-2 font-normal normal-case text-[color:var(--muted)]">
                ({filteredStores.length}
                {filteredStores.length !== stores.length ? ' po filtrach' : ''})
              </span>
            )}
          </h2>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[color:var(--muted)] sm:justify-end sm:gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-neutral-500" /> Nie sprawdzony
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-slate-500" /> Niski
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" /> Średni
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" /> Wysoki
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" /> Must visit
            </span>
          </div>
        </div>

        {loading && stores.length === 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 min-w-0 animate-pulse rounded-[var(--radius-lg)] bg-[color:var(--surface)]" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--border-strong)] px-6 py-16 text-center">
            <p className="text-sm text-[color:var(--muted-light)]">
              {stores.length === 0 ? 'Brak punktów na mapie.' : 'Brak wyników dla wybranych filtrów.'}
            </p>
            {stores.length === 0 && isAdmin ? (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Dodaj pierwszy lumpeks
              </button>
            ) : stores.length === 0 ? null : (
              <button
                type="button"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS)
                  setPage(1)
                }}
                className="mt-4 rounded-xl border border-[color:var(--border-strong)] px-4 py-2 text-sm text-[color:var(--muted-light)] hover:text-[color:var(--ink)]"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              {pageStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={selectedId === store.id}
                  isAdmin={isAdmin}
                  distanceMeters={
                    userLocation
                      ? distanceMeters(userLocation, { lat: store.lat, lng: store.lng })
                      : null
                  }
                  onSelect={() => setSelectedId(store.id)}
                  onInfo={() => setInfoStore(store)}
                  onEdit={() => openEditModal(store)}
                  onDelete={() => void handleDelete(store.id)}
                  onNavigate={() => openNavigation(store.lat, store.lng)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3 sm:px-4">
                <p className="text-center text-xs text-[color:var(--muted)]">
                  Strona <span className="font-medium text-[color:var(--ink)]">{safePage}</span> / {totalPages}
                  <span className="text-[color:var(--muted)]">
                    {' '}
                    · {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filteredStores.length)} z {filteredStores.length}
                  </span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[color:var(--border-strong)] text-xs font-medium text-[color:var(--muted-light)] transition hover:text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Poprzednia
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[color:var(--border-strong)] text-xs font-medium text-[color:var(--muted-light)] transition hover:text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Następna
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {infoStore && (
        <StoreInfoPanel
          store={infoStore}
          isAdmin={isAdmin}
          onClose={() => setInfoStore(null)}
          onEdit={() => openEditModal(infoStore)}
          onNavigate={() => openNavigation(infoStore.lat, infoStore.lng)}
        />
      )}

      {modalOpen && isAdmin && (
        <StoreModal
          initial={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}

function iconClass() {
  return 'h-[18px] w-[18px]'
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function LoginIcon() {
  return (
    <svg className={iconClass()} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className={iconClass()} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className={iconClass()} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className={iconClass()} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  )
}
