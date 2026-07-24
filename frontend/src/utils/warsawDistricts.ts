export type WarsawDistrict = {
  id: string
  label: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export const WARSAW_DISTRICTS: WarsawDistrict[] = [
  { id: 'all', label: 'Cała Warszawa', minLat: 52.1, maxLat: 52.35, minLng: 20.85, maxLng: 21.25 },
  { id: 'srodmiescie', label: 'Śródmieście', minLat: 52.22, maxLat: 52.25, minLng: 20.99, maxLng: 21.02 },
  { id: 'mokotow', label: 'Mokotów', minLat: 52.17, maxLat: 52.21, minLng: 20.98, maxLng: 21.06 },
  { id: 'wola', label: 'Wola', minLat: 52.22, maxLat: 52.25, minLng: 20.92, maxLng: 21.0 },
  { id: 'ochota', label: 'Ochota', minLat: 52.2, maxLat: 52.23, minLng: 20.96, maxLng: 21.02 },
  { id: 'zoliborz', label: 'Żoliborz', minLat: 52.26, maxLat: 52.29, minLng: 20.97, maxLng: 21.05 },
  { id: 'praga', label: 'Praga', minLat: 52.24, maxLat: 52.27, minLng: 21.02, maxLng: 21.08 },
  { id: 'bielany', label: 'Bielany', minLat: 52.27, maxLat: 52.3, minLng: 20.93, maxLng: 21.05 },
  { id: 'ursynow', label: 'Ursynów', minLat: 52.14, maxLat: 52.17, minLng: 21.0, maxLng: 21.08 },
  { id: 'wilanow', label: 'Wilanów', minLat: 52.15, maxLat: 52.19, minLng: 21.05, maxLng: 21.12 },
  { id: 'bemowo', label: 'Bemowo', minLat: 52.23, maxLat: 52.26, minLng: 20.88, maxLng: 20.96 },
  { id: 'targowek', label: 'Targówek', minLat: 52.26, maxLat: 52.29, minLng: 21.04, maxLng: 21.12 },
  { id: 'bialoleka', label: 'Białołęka', minLat: 52.28, maxLat: 52.32, minLng: 21.02, maxLng: 21.15 },
  { id: 'wawer', label: 'Wawer', minLat: 52.2, maxLat: 52.24, minLng: 21.08, maxLng: 21.25 },
  { id: 'ursus', label: 'Ursus', minLat: 52.18, maxLat: 52.21, minLng: 20.85, maxLng: 20.95 },
  { id: 'lochy', label: 'Włochy', minLat: 52.18, maxLat: 52.22, minLng: 20.9, maxLng: 20.98 },
]

export function storeInDistrict(lat: number, lng: number, districtId: string): boolean {
  if (districtId === 'all') return true
  const d = WARSAW_DISTRICTS.find((x) => x.id === districtId)
  if (!d) return true
  return lat >= d.minLat && lat <= d.maxLat && lng >= d.minLng && lng <= d.maxLng
}

export type SortMode = 'hotness' | 'distance'
