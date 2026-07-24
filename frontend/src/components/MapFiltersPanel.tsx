import FilterSelect, { FilterToggle } from './FilterSelect'
import type { MapFilters } from '../utils/storeFilters'
import type { SortMode } from '../utils/warsawDistricts'
import { WARSAW_DISTRICTS } from '../utils/warsawDistricts'

type Props = {
  filters: MapFilters
  onChange: (patch: Partial<MapFilters>) => void
  hideSearch?: boolean
}

export default function MapFiltersPanel({ filters, onChange, hideSearch = false }: Props) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-5">
      {!hideSearch && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Wyszukiwanie</p>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="np. Humana, Vive…"
            className="mt-2 w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
          />
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Dzielnica</p>
        <FilterSelect
          value={filters.districtId}
          onChange={(districtId) => onChange({ districtId })}
          options={WARSAW_DISTRICTS.map((d) => ({ value: d.id, label: d.label }))}
        />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--muted)]">Sortowanie</p>
        <div className="mt-2 flex rounded-xl bg-[color:var(--bg)] p-1 ring-1 ring-[color:var(--border)]">
          <SortButton
            active={filters.sortMode === 'hotness'}
            onClick={() => onChange({ sortMode: 'hotness' satisfies SortMode })}
            label="Priorytet"
            sub="Gorącość"
          />
          <SortButton
            active={filters.sortMode === 'distance'}
            onClick={() => onChange({ sortMode: 'distance' satisfies SortMode })}
            label="Odległość"
            sub="Od Ciebie"
          />
        </div>
      </div>

      <FilterToggle
        title="Nadchodzące dostawy"
        description="Tylko zweryfikowane terminy od dziś"
        checked={filters.upcomingOnly}
        onChange={(upcomingOnly) => onChange({ upcomingOnly })}
      />

      <FilterToggle
        title="Do weryfikacji"
        description="Lumpeksy jeszcze nie sprawdzone"
        checked={filters.unverifiedOnly}
        onChange={(unverifiedOnly) => onChange({ unverifiedOnly })}
      />
    </div>
  )
}

function SortButton({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean
  onClick: () => void
  label: string
  sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-2 text-center transition ${
        active
          ? 'bg-[color:var(--accent)] text-white shadow-[0_0_16px_var(--accent-glow)]'
          : 'text-[color:var(--muted-light)] hover:text-[color:var(--ink)]'
      }`}
    >
      <span className="block text-xs font-semibold">{label}</span>
      <span className={`block text-[10px] ${active ? 'text-[color:var(--ink)]/80' : 'text-[color:var(--muted)]'}`}>{sub}</span>
    </button>
  )
}
