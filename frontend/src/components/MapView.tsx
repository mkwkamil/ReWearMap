import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { ThriftStore } from '../api/client'
import { useTheme } from '../theme/ThemeContext'
import { hotnessStyles, unverifiedStyles } from '../utils/hotness'

const WARSAW: L.LatLngExpression = [52.2297, 21.0122]
const USER_MARKER = { fill: '#3b82f6', stroke: '#93c5fd' }

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
} as const

type Props = {
  stores: ThriftStore[]
  selectedId: string | null
  onSelect: (id: string) => void
  onUserLocation?: (lat: number, lng: number) => void
  /** Increment to programmatically request geolocation (e.g. when sorting by distance). */
  locateRequestId?: number
}


export default function MapView({ stores, selectedId, onSelect, onUserLocation, locateRequestId = 0 }: Props) {
  const { theme } = useTheme()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const userLayerRef = useRef<L.LayerGroup | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const onUserLocationRef = useRef(onUserLocation)
  const lastLocateRequestRef = useRef(0)

  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [hasUserLocation, setHasUserLocation] = useState(false)

  useEffect(() => {
    onUserLocationRef.current = onUserLocation
  }, [onUserLocation])

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const paintUserLocation = useCallback((lat: number, lng: number, accuracy?: number) => {
    const map = mapRef.current
    const layer = userLayerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    if (accuracy && accuracy > 0 && accuracy < 2000) {
      L.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(layer)
    }

    L.circleMarker([lat, lng], {
      radius: 9,
      color: USER_MARKER.stroke,
      weight: 3,
      fillColor: USER_MARKER.fill,
      fillOpacity: 1,
      interactive: false,
    })
      .bindTooltip('Twoja lokalizacja', { direction: 'top', opacity: 1 })
      .addTo(layer)

    setHasUserLocation(true)
    onUserLocationRef.current?.(lat, lng)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper || mapRef.current) return

    const map = L.map(container, {
      center: WARSAW,
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    })

    const initialTheme =
      document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    tileRef.current = L.tileLayer(TILE_URLS[initialTheme], { maxZoom: 19 }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    userLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    const refreshSize = () => {
      const { clientWidth, clientHeight } = wrapper
      if (clientWidth < 2 || clientHeight < 2) return
      map.invalidateSize({ animate: false, pan: false })
    }

    map.whenReady(refreshSize)
    requestAnimationFrame(refreshSize)
    const t1 = window.setTimeout(refreshSize, 50)
    const t2 = window.setTimeout(refreshSize, 250)
    const t3 = window.setTimeout(refreshSize, 500)

    const observer = new ResizeObserver(() => {
      refreshSize()
    })
    observer.observe(wrapper)

    const onWindowResize = () => refreshSize()
    window.addEventListener('resize', onWindowResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onWindowResize)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      clearWatch()
      map.remove()
      mapRef.current = null
      tileRef.current = null
      markersRef.current = null
      userLayerRef.current = null
    }
  }, [clearWatch])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (tileRef.current) {
      map.removeLayer(tileRef.current)
      tileRef.current = null
    }
    tileRef.current = L.tileLayer(TILE_URLS[theme], { maxZoom: 19 }).addTo(map)
  }, [theme])

  useEffect(() => {
    const map = mapRef.current
    const group = markersRef.current
    if (!map || !group) return

    group.clearLayers()

    stores.forEach((store) => {
      const isSelected = store.id === selectedId
      const unverified = !store.delivery_verified
      const colors = unverified ? unverifiedStyles.marker : hotnessStyles(store.hotness).marker
      const marker = L.circleMarker([store.lat, store.lng], {
        radius: isSelected ? 12 : unverified ? 6 : 8,
        color: isSelected ? '#3b82f6' : colors.stroke,
        weight: isSelected ? 3 : 2,
        fillColor: isSelected ? '#3b82f6' : colors.fill,
        fillOpacity: unverified && !isSelected ? 0.65 : 0.9,
      })
      const tip = unverified
        ? `<strong>${store.name}</strong><br/><span style="opacity:.75">Nie sprawdzony</span>`
        : `<strong>${store.name}</strong><br/>★ ${store.hotness}/10`
      marker.bindTooltip(tip, {
        direction: 'top',
        opacity: 1,
      })
      marker.on('click', () => onSelect(store.id))
      marker.addTo(group)
    })
  }, [stores, selectedId, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.invalidateSize({ animate: false, pan: false })

    if (stores.length === 0) {
      map.setView(WARSAW, 12)
      return
    }

    const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.15))
    window.setTimeout(() => map.invalidateSize({ animate: false, pan: false }), 50)
  }, [stores])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const store = stores.find((s) => s.id === selectedId)
    if (!store) return
    map.panTo([store.lat, store.lng], { animate: true })
  }, [selectedId, stores])

  const locateMe = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (!navigator.geolocation) {
      setLocateError('Geolokalizacja niedostępna w tej przeglądarce')
      return
    }

    if (!window.isSecureContext) {
      setLocateError('Wymagane HTTPS (lub localhost) — HTTP blokuje lokalizację')
      return
    }

    setLocateError(null)
    setLocating(true)
    clearWatch()

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords
      paintUserLocation(latitude, longitude, accuracy)
      map.setView([latitude, longitude], Math.max(map.getZoom(), 14), { animate: true })
      setLocating(false)
      setLocateError(null)

      if (watchIdRef.current == null) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (next) => {
            paintUserLocation(next.coords.latitude, next.coords.longitude, next.coords.accuracy)
          },
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 5000 },
        )
      }
    }

    const onError = (err: GeolocationPositionError) => {
      setLocating(false)
      if (err.code === err.PERMISSION_DENIED) {
        setLocateError('Brak zgody na lokalizację — włącz w ustawieniach przeglądarki')
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setLocateError('Nie udało się ustalić pozycji')
      } else {
        setLocateError('Timeout lokalizacji — spróbuj ponownie')
      }
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    })
  }, [clearWatch, paintUserLocation])

  useEffect(() => {
    if (!locateRequestId || locateRequestId === lastLocateRequestRef.current) return
    lastLocateRequestRef.current = locateRequestId
    locateMe()
  }, [locateRequestId, locateMe])

  const didAutoLocateRef = useRef(false)
  useEffect(() => {
    if (didAutoLocateRef.current) return
    if (!window.isSecureContext || !navigator.geolocation) return
    didAutoLocateRef.current = true
    const t = window.setTimeout(() => locateMe(), 400)
    return () => window.clearTimeout(t)
  }, [locateMe])

  return (
    <div ref={wrapperRef} className="absolute inset-0 overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute bottom-3 right-3 z-[500] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-raised)]/95 text-[color:var(--ink)] shadow-lg backdrop-blur transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface-hover)] disabled:opacity-60"
          title={locating ? 'Szukam…' : hasUserLocation ? 'Odśwież lokalizację' : 'Moja lokalizacja'}
          aria-label={locating ? 'Szukam lokalizacji' : 'Moja lokalizacja'}
        >
          <LocateIcon pulse={locating} />
        </button>
        {locateError && (
          <p className="pointer-events-auto max-w-[11rem] rounded-lg border border-amber-500/40 bg-[color:var(--surface-raised)] px-2.5 py-1.5 text-[11px] text-amber-700 shadow-lg backdrop-blur">
            {locateError}
          </p>
        )}
      </div>
    </div>
  )
}

function LocateIcon({ pulse }: { pulse?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-[color:var(--accent)] ${pulse ? 'animate-pulse' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
  )
}

