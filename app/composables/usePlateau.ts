import type { MapViewState } from '@deck.gl/core'
import plateauConfig from '@@/data/plateau-assets.json'

export interface PlateauAssetConfig {
  id: string
  name: string
  assetId: number
  viewState?: Partial<MapViewState>
}

export interface PlateauFeature {
  properties?: Record<string, unknown>
  [key: string]: unknown
}

const CONFIG_ASSETS = plateauConfig.assets as PlateauAssetConfig[]
const CONFIG_DEFAULT_LAYER = plateauConfig.defaultLayer

export function usePlateau() {
  const config = useRuntimeConfig()

  // 現在選択中のレイヤーID
  const activeLayerId = useState<string>(
    'plateau-active-layer',
    () => CONFIG_DEFAULT_LAYER || CONFIG_ASSETS[0]?.id || '',
  )

  const layers = computed<(PlateauAssetConfig & { visible: boolean })[]>(() =>
    CONFIG_ASSETS.map((l) => ({ ...l, visible: l.id === activeLayerId.value })),
  )

  const { flyTo } = useViewState()

  function selectLayer(id: string) {
    activeLayerId.value = id
    const target = CONFIG_ASSETS.find((l) => l.id === id)
    if (target?.viewState) {
      flyTo({ name: target.name, viewState: target.viewState as MapViewState })
    }
  }

  function isLayerActive(id: string) {
    return activeLayerId.value === id
  }

  const hasValidToken = computed(() => Boolean(config.public.cesiumIonToken))

  const visibleLayers = computed(() =>
    layers.value.filter((l) => l.visible && l.assetId > 0),
  )

  return {
    layers,
    visibleLayers,
    hasValidToken,
    selectLayer,
    isLayerActive,
  }
}
