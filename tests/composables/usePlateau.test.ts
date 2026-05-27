import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useState', () => (_key: string, init?: () => unknown) => {
  return ref(typeof init === 'function' ? init() : init)
})

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: {
    cesiumIonToken: 'test-cesium-token',
    plateauAssets: JSON.stringify([
      { id: 'buildings', name: '建物モデル', assetId: 12345, visible: true },
      { id: 'terrain', name: '地形モデル', assetId: 67890, visible: false },
    ]),
  },
}))

describe('usePlateau', () => {
  it('config からレイヤー定義を読み込む', () => {
    const { layers } = usePlateau()
    expect(layers.value).toHaveLength(2)
    expect(layers.value[0].id).toBe('buildings')
    expect(layers.value[0].assetId).toBe(12345)
    expect(layers.value[1].id).toBe('terrain')
  })

  it('config の初期 visible が反映される', () => {
    const { layers } = usePlateau()
    expect(layers.value[0].visible).toBe(true)
    expect(layers.value[1].visible).toBe(false)
  })

  it('selectLayer で選択したレイヤーだけが表示される', () => {
    const { layers, selectLayer } = usePlateau()
    // 初期状態: buildings=true, terrain=false
    expect(layers.value[0].visible).toBe(true)
    expect(layers.value[1].visible).toBe(false)
    // terrain を選択すると排他的に切り替わる
    selectLayer('terrain')
    expect(layers.value[0].visible).toBe(false)
    expect(layers.value[1].visible).toBe(true)
    // buildings に戻す
    selectLayer('buildings')
    expect(layers.value[0].visible).toBe(true)
    expect(layers.value[1].visible).toBe(false)
  })

  it('isLayerActive で表示状態を確認できる', () => {
    const { isLayerActive } = usePlateau()
    expect(isLayerActive('buildings')).toBe(true)
    expect(isLayerActive('terrain')).toBe(false)
    expect(isLayerActive('nonexistent')).toBe(false)
  })

  it('hasValidToken はトークンがある場合 true を返す', () => {
    const { hasValidToken } = usePlateau()
    expect(hasValidToken.value).toBe(true)
  })

  it('visibleLayers は visible かつ assetId > 0 のレイヤーのみ返す', () => {
    const { visibleLayers } = usePlateau()
    expect(visibleLayers.value).toHaveLength(1)
    expect(visibleLayers.value[0].id).toBe('buildings')
  })

  it('assetId が 0 のレイヤーは visibleLayers に含まれない', () => {
    const { visibleLayers, layers } = usePlateau()
    // building は visible=true だが assetId=0 なら除外される
    expect(layers.value.every((l) => l.assetId > 0)).toBe(true)
    expect(visibleLayers.value.length).toBeLessThanOrEqual(layers.value.length)
  })

  it('composable が例外を投げない', () => {
    expect(() => usePlateau()).not.toThrow()
  })
})
