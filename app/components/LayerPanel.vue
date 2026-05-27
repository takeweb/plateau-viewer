<script setup lang="ts">
import type { PlateauAssetConfig } from '~/composables/usePlateau'
import type { LayerTreeNode } from './LayerTreeNode.vue'

const { layers, hasValidToken, selectLayer, isLayerActive } = usePlateau()

function buildTree(items: PlateauAssetConfig[]): LayerTreeNode[] {
  const root: LayerTreeNode = { label: '', path: '', children: [] }
  for (const layer of items) {
    const segments = layer.name.split('/').map((s) => s.trim()).filter(Boolean)
    if (segments.length === 0) continue
    let current = root
    let pathSoFar = ''
    segments.forEach((seg, i) => {
      pathSoFar = pathSoFar ? `${pathSoFar}/${seg}` : seg
      let child = current.children.find((c) => c.label === seg)
      if (!child) {
        child = { label: seg, path: pathSoFar, children: [] }
        current.children.push(child)
      }
      if (i === segments.length - 1) child.layer = layer
      current = child
    })
  }
  return root.children
}

const tree = computed(() => buildTree(layers.value))
</script>

<template>
  <div class="bg-white border border-gray-300 rounded-lg shadow-lg text-gray-900 w-64 p-4 space-y-4">
    <h1 class="text-base font-bold text-sky-600 tracking-wide">PLATEAU 3D ビューワー</h1>

    <div v-if="!hasValidToken" class="bg-amber-50 border border-amber-400 rounded p-3 text-xs text-amber-800">
      <p class="font-semibold mb-1">⚠ Cesium ion トークン未設定</p>
      <p>
        <code>.env</code> ファイルに
        <code>NUXT_PUBLIC_CESIUM_ION_TOKEN</code> を設定してください。
      </p>
    </div>

    <section>
      <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">レイヤー</h2>
      <ul class="space-y-1">
        <LayerTreeNode
          v-for="node in tree"
          :key="node.path"
          :node="node"
          :depth="0"
          :is-active="isLayerActive"
          :on-select="selectLayer"
        />
      </ul>
    </section>

    <section class="text-xs text-gray-600 space-y-1 border-t border-gray-200 pt-3">
      <p>🖱 ドラッグ: 移動</p>
      <p>🖱 右ドラッグ / Ctrl+ドラッグ: 回転</p>
      <p>🖱 スクロール: ズーム</p>
    </section>
  </div>
</template>
