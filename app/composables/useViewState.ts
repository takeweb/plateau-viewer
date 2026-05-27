import type { MapViewState } from '@deck.gl/core'
import plateauConfig from '@@/data/plateau-assets.json'

const FALLBACK_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 2,
  pitch: 0,
  bearing: 0,
  minZoom: 4,
  maxZoom: 22,
}

function resolveInitialViewState(): MapViewState {
  const defaultId = plateauConfig.defaultLayer
  const assets = plateauConfig.assets
  const target = defaultId
    ? (assets.find((a) => a.id === defaultId) ?? assets[0])
    : assets[0]
  if (target?.viewState) {
    return { ...FALLBACK_VIEW_STATE, ...target.viewState }
  }
  return FALLBACK_VIEW_STATE
}

export interface CityPreset {
  name: string
  viewState: MapViewState
}

export function useViewState() {
  const viewState = useState<MapViewState>('view-state', () => resolveInitialViewState())
  const flyToTarget = useState<MapViewState | null>('view-flyto-target', () => null)
  const flyToCounter = useState<number>('view-flyto-counter', () => 0)

  function flyTo(preset: CityPreset) {
    flyToTarget.value = preset.viewState
    flyToCounter.value++
  }

  return { viewState, flyTo, flyToTarget, flyToCounter }
}
