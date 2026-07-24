import type { ThriftStore } from '../api/client'
import { daysUntil } from '../utils/dates'
import { distanceMeters, type LatLng } from '../utils/geo'
import type { SortMode } from '../utils/warsawDistricts'
import { storeInDistrict } from '../utils/warsawDistricts'

export type MapFilters = {
  query: string
  districtId: string
  upcomingOnly: boolean
  unverifiedOnly: boolean
  sortMode: SortMode
}

function byName(a: ThriftStore, b: ThriftStore) {
  return a.name.localeCompare(b.name, 'pl')
}

function byHotnessDesc(a: ThriftStore, b: ThriftStore) {
  return b.hotness - a.hotness || byName(a, b)
}

function byDistanceAsc(a: ThriftStore, b: ThriftStore, userLocation: LatLng) {
  const da = distanceMeters(userLocation, { lat: a.lat, lng: a.lng })
  const db = distanceMeters(userLocation, { lat: b.lat, lng: b.lng })
  return da - db || byName(a, b)
}

function daysToDelivery(store: ThriftStore): number {
  if (!store.next_delivery) return Number.POSITIVE_INFINITY
  const days = daysUntil(store.next_delivery)
  return days === null ? Number.POSITIVE_INFINITY : days
}

/**
 * Sort rules (district + name are filters only):
 *
 * - Priority, upcoming off, unverified off → rating ↓, unverified last
 * - Distance, upcoming off, unverified off → distance ↑
 * - Priority, upcoming on, unverified off → days to delivery ↑, then rating ↓
 * - Distance, upcoming on, unverified off → days to delivery ↑, then distance ↑
 * - Priority + unverified on → alphabetical
 * - Distance + unverified on → distance ↑
 */
export function filterAndSortStores(
  stores: ThriftStore[],
  filters: MapFilters,
  userLocation: LatLng | null = null,
): ThriftStore[] {
  const q = filters.query.trim().toLowerCase()

  const result = stores.filter((store) => {
    if (q && !store.name.toLowerCase().includes(q)) return false
    if (!storeInDistrict(store.lat, store.lng, filters.districtId)) return false
    if (filters.unverifiedOnly && store.delivery_verified) return false
    if (filters.upcomingOnly) {
      if (!store.delivery_enabled || !store.delivery_verified || !store.next_delivery) return false
      const days = daysUntil(store.next_delivery)
      if (days === null || days < 0) return false
    }
    return true
  })

  return result.slice().sort((a, b) => {
    // Do weryfikacji — osobna ścieżka sortowania
    if (filters.unverifiedOnly) {
      if (filters.sortMode === 'distance' && userLocation) {
        return byDistanceAsc(a, b, userLocation)
      }
      return byName(a, b)
    }

    // Nadchodzące dostawy — najpierw dni do dostawy
    if (filters.upcomingOnly) {
      const daysDiff = daysToDelivery(a) - daysToDelivery(b)
      if (daysDiff !== 0) return daysDiff

      if (filters.sortMode === 'distance') {
        if (userLocation) return byDistanceAsc(a, b, userLocation)
        return byName(a, b)
      }
      // Priorytet: remis dni → lepsza ocena
      return byHotnessDesc(a, b)
    }

    // Domyślnie: Priorytet / Odległość bez dodatkowych przełączników
    if (filters.sortMode === 'distance') {
      if (userLocation) return byDistanceAsc(a, b, userLocation)
      return byName(a, b)
    }

    // Priorytet: sprawdzone po ocenie ↓, niesprawdzone na końcu
    const aUnverified = !a.delivery_verified
    const bUnverified = !b.delivery_verified
    if (aUnverified !== bUnverified) return aUnverified ? 1 : -1
    if (!aUnverified && !bUnverified) return byHotnessDesc(a, b)
    return byName(a, b)
  })
}
