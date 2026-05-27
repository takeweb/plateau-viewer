<script setup lang="ts">
import { Deck, FlyToInterpolator, type MapViewState } from '@deck.gl/core'
import { BitmapLayer } from '@deck.gl/layers'
import { Tile3DLayer, TileLayer } from '@deck.gl/geo-layers'
import { Tiles3DLoader } from '@loaders.gl/3d-tiles'
import { resolvePlaateauAssets, type ResolvedAsset } from '~/composables/useCesiumIon'
import type { PlateauFeature } from '~/composables/usePlateau'

const config = useRuntimeConfig()
const { visibleLayers, hasValidToken } = usePlateau()
const { viewState, flyToTarget, flyToCounter } = useViewState()

const containerRef = ref<HTMLDivElement>()
const selectedFeature = ref<PlateauFeature | null>(null)
const loadError = ref<string | null>(null)
const resolvedAssets = ref<ResolvedAsset[]>([])

let deck: Deck | null = null
let cachedPlateauLayers: Tile3DLayer[] = []
let cachedKey = ''

// b3dm の batch table から指定 batchId の属性を組み立てる。
// deck.gl の Tile3DLayer は picking 時 info.object にタイルを、info.index に batchId を入れる。
function extractFeatureProperties(
  tile: any,
  batchId: number | undefined,
): Record<string, unknown> | null {
  if (tile == null || batchId == null || batchId < 0) return null
  const content = tile.content ?? tile
  const batchTable =
    content?.batchTableJson ?? content?.batchTable?.json ?? content?.batchTable ?? null
  if (!batchTable || typeof batchTable !== 'object') return null
  const props: Record<string, unknown> = {}
  for (const [key, column] of Object.entries(batchTable)) {
    if (Array.isArray(column)) props[key] = column[batchId]
  }
  return Object.keys(props).length > 0 ? props : null
}

function buildLayers() {
  const baseMap = new TileLayer({
    id: 'base-map',
    data: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: (props) => {
      const bbox = props.tile.bbox as {
        west: number
        south: number
        east: number
        north: number
      }
      return new BitmapLayer({
        ...props,
        data: undefined,
        image: props.data,
        bounds: [bbox.west, bbox.south, bbox.east, bbox.north],
      })
    },
  })

  const key = resolvedAssets.value.map((a) => a.tilesetUrl).join('|')
  if (key !== cachedKey) {
    cachedKey = key
    cachedPlateauLayers = resolvedAssets.value.map(
      (asset) =>
        new Tile3DLayer({
          id: `plateau-${asset.id}`,
          data: asset.tilesetUrl,
          loader: Tiles3DLoader,
          loadOptions: {
            fetch: {
              headers: { Authorization: `Bearer ${asset.accessToken}` },
            },
            // パフォーマンス制限 (デフォルトより少し緩い)
            tileset: {
              maximumScreenSpaceError: 16,
              maximumMemoryUsage: 64,
            },
          },
          pickable: true,
          onClick: (info) => {
            const properties = extractFeatureProperties(info.object, info.index)
            console.log('[plateau] clicked feature:', { batchId: info.index, properties, tile: info.object })
            selectedFeature.value = properties ? { properties } : null
          },
          onTilesetLoad: (tileset) => {
            console.log(`[plateau] ${asset.id} 3Dタイルセット読み込み成功 (ルートのカバー範囲: ${Math.round(tileset.root?.header?.geometricError ?? 0)}m)`)
          },
          onTileLoad: (tile) => {
            const t = tile as any
            console.log(`[plateau] tile loaded type:${t.type} origin:${t.content?.cartographicOrigin?.map?.((n: number) => +n.toFixed(4)).join(',')}`)
          },
          onTileError: (tile, message, url) => {
            console.error('[plateau] タイル読み込みエラー:', url, message)
            loadError.value = `タイル読み込みエラー: ${message}`
          },
        }),
    )
  }

  return [baseMap, ...cachedPlateauLayers]
}

async function resolveAndRebuild() {
  const token = config.public.cesiumIonToken as string
  if (!token || !visibleLayers.value.length) {
    resolvedAssets.value = []
    deck?.setProps({ layers: buildLayers() })
    return
  }

  try {
    resolvedAssets.value = await resolvePlaateauAssets(visibleLayers.value, token)
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
    resolvedAssets.value = []
  }
  deck?.setProps({ layers: buildLayers() })
}

onMounted(async () => {
  if (!containerRef.value) return

  deck = new Deck({
    parent: containerRef.value,
    width: '100%',
    height: '100%',
    initialViewState: viewState.value as MapViewState,
    controller: true,
    layers: buildLayers(),
    deviceProps: { debug: false },
    onViewStateChange: ({ viewState: vs }) => {
      viewState.value = vs as MapViewState
    },
  })

  await resolveAndRebuild()
})

watch(visibleLayers, () => resolveAndRebuild(), { deep: true })

// LayerPanel のプリセットボタンが押されたらカメラをアニメーション移動
watch(flyToCounter, () => {
  if (!flyToTarget.value || !deck) return
  deck.setProps({
    initialViewState: {
      ...flyToTarget.value,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator(),
    } as MapViewState,
  })
})

onUnmounted(() => {
  deck?.finalize()
  deck = null
})
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="containerRef" class="w-full h-full" />

    <!-- 地図アトリビューション -->
    <div class="absolute bottom-2 right-2 text-xs text-gray-700 bg-white/80 px-1.5 py-0.5 rounded">
      © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" class="underline hover:text-gray-900">OpenStreetMap</a> contributors
    </div>

    <!-- エラー表示 -->
    <div
      v-if="loadError"
      class="absolute top-4 right-4 bg-red-900/90 border border-red-600 rounded-lg p-4 text-sm text-red-200 max-w-sm space-y-1"
    >
      <p class="font-semibold">⚠ 3Dデータの読み込みエラー</p>
      <p class="text-xs opacity-80">{{ loadError }}</p>
      <button class="text-xs underline mt-1" @click="loadError = null">閉じる</button>
    </div>

    <!-- 建物属性情報 -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition-all duration-150"
      leave-to-class="opacity-0 translate-y-2"
    >
      <FeatureInfo
        v-if="selectedFeature"
        :feature="selectedFeature"
        class="absolute bottom-4 left-72 ml-4"
        @close="selectedFeature = null"
      />
    </Transition>
  </div>
</template>
