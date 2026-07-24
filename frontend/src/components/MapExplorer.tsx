import { lazy, Suspense, useEffect, useState } from 'react'
import type { ThriftStore } from '../api/client'
import MapFiltersPanel from './MapFiltersPanel'
import type { MapFilters } from '../utils/storeFilters'

const MapView = lazy(() => import('./MapView'))

type Props = {
  stores: ThriftStore[]
  filteredStores: ThriftStore[]
  filters: MapFilters
  selectedId: string | null
  dimmed: boolean
  mapLoading?: boolean
  locateRequestId?: number
  onFiltersChange: (patch: Partial<MapFilters>) => void
  onSelect: (id: string) => void
  onClearSelection: () => void
  onUserLocation?: (lat: number, lng: number) => void
}

function isDesktop() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(min-width: 1024px)').matches
}

function activeFilterCount(filters: MapFilters): number {
  let n = 0
  if (filters.query.trim()) n += 1
  if (filters.districtId !== 'all') n += 1
  if (filters.upcomingOnly) n += 1
  if (filters.unverifiedOnly) n += 1
  if (filters.sortMode !== 'hotness') n += 1
  return n
}

export default function MapExplorer({
  stores,
  filteredStores,
  filters,
  selectedId,
  dimmed,
  mapLoading = false,
  locateRequestId = 0,
  onFiltersChange,
  onSelect,
  onClearSelection,
  onUserLocation,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterCount = activeFilterCount(filters)

  useEffect(() => {
    // Desktop: show full filters panel; mobile stays collapsed
    if (isDesktop()) setFiltersOpen(true)
  }, [])

  useEffect(() => {
    if (expanded) {
      const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 320)
      return () => window.clearTimeout(t)
    }
  }, [expanded])

  useEffect(() => {
    if (filtersOpen && expanded) {
      const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 320)
      return () => window.clearTimeout(t)
    }
  }, [filtersOpen, expanded])

  return (
    <section
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] ring-1 ring-[color:var(--border)] transition ${
        dimmed ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center justify-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3 py-2.5 transition hover:bg-[color:var(--surface-hover)] sm:px-4"
        aria-expanded={expanded}
      >
        <Chevron expanded={expanded} />
        <span className="text-xs font-medium text-[color:var(--muted-light)] group-hover:text-[color:var(--ink)]">
          {expanded ? 'Zwiń mapę' : 'Pokaż mapę'}
        </span>
        <span className="rounded-full bg-[color:var(--track)] px-2 py-0.5 text-[10px] text-[color:var(--muted)]">
          {mapLoading ? '…' : `${filteredStores.length} / ${stores.length}`}
        </span>
        <Chevron expanded={expanded} />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,300px)] lg:items-stretch">
            <div className="relative flex min-h-0 flex-col border-b border-[color:var(--border)] lg:border-b-0 lg:border-r">
              {selectedId && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="absolute right-3 top-3 z-[500] rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-raised)]/95 px-2.5 py-1 text-xs text-[color:var(--muted)] shadow-lg backdrop-blur transition hover:text-[color:var(--ink)]"
                >
                  Odznacz
                </button>
              )}
              <div className="relative h-[min(42vh,340px)] min-h-[240px] w-full lg:h-auto lg:min-h-[300px] lg:flex-1">
                {mapLoading ? (
                  <div className="absolute inset-0 animate-pulse bg-[color:var(--surface-raised)]" />
                ) : (
                  <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-[color:var(--surface-raised)]" />}>
                    <MapView
                      stores={filteredStores}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onUserLocation={onUserLocation}
                      locateRequestId={locateRequestId}
                    />
                  </Suspense>
                )}
              </div>
            </div>

            <div className="bg-[color:var(--surface)] lg:flex lg:flex-col">
              {/* Mobile: compact search + filters toggle */}
              <div className="border-b border-[color:var(--border)] p-3 lg:hidden">
                <input
                  type="search"
                  value={filters.query}
                  onChange={(e) => onFiltersChange({ query: e.target.value })}
                  placeholder="Szukaj lumpeksu…"
                  className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  className="mt-2 flex w-full items-center justify-between rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] px-3 py-2.5 text-left text-xs font-medium text-[color:var(--muted-light)]"
                  aria-expanded={filtersOpen}
                >
                  <span>
                    Filtry
                    {filterCount > 0 && (
                      <span className="ml-2 rounded-full bg-[color:var(--accent)]/20 px-1.5 py-0.5 text-[10px] text-[color:var(--accent)]">
                        {filterCount}
                      </span>
                    )}
                  </span>
                  <Chevron expanded={filtersOpen} />
                </button>
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out lg:!grid-rows-[1fr] ${
                  filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="lg:block">
                    {/* Hide duplicate search on mobile — already in compact bar */}
                    <div className="lg:hidden">
                      <MapFiltersPanel filters={filters} onChange={onFiltersChange} hideSearch />
                    </div>
                    <div className="hidden lg:block">
                      <MapFiltersPanel filters={filters} onChange={onFiltersChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-[color:var(--muted)] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
