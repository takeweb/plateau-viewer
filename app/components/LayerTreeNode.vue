<script setup lang="ts">
import type { PlateauAssetConfig } from '~/composables/usePlateau'

export interface LayerTreeNode {
  label: string
  path: string
  layer?: PlateauAssetConfig
  children: LayerTreeNode[]
}

defineProps<{
  node: LayerTreeNode
  depth: number
  isActive: (id: string) => boolean
  onSelect: (id: string) => void
}>()

const open = ref(true)
</script>

<template>
  <li>
    <button
      v-if="node.layer && node.children.length === 0"
      class="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm"
      :class="isActive(node.layer.id) ? 'text-gray-900 font-medium' : 'text-gray-500'"
      :disabled="node.layer.assetId === 0"
      :style="{ paddingLeft: `${depth * 12 + 8}px` }"
      @click="onSelect(node.layer.id)"
    >
      <span
        class="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        :class="isActive(node.layer.id) ? 'border-sky-600' : 'border-gray-400'"
      >
        <span v-if="isActive(node.layer.id)" class="w-2 h-2 rounded-full bg-sky-600" />
      </span>
      <span class="truncate">{{ node.label }}</span>
      <span v-if="node.layer.assetId === 0" class="ml-auto text-xs text-gray-400">未設定</span>
    </button>

    <template v-else>
      <button
        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm text-gray-800 font-medium"
        :style="{ paddingLeft: `${depth * 12 + 8}px` }"
        @click="open = !open"
      >
        <span class="text-xs w-3 text-gray-500">{{ open ? '▼' : '▶' }}</span>
        <span class="truncate">{{ node.label }}</span>
      </button>
      <ul v-if="open" class="space-y-1">
        <LayerTreeNode
          v-for="child in node.children"
          :key="child.path"
          :node="child"
          :depth="depth + 1"
          :is-active="isActive"
          :on-select="onSelect"
        />
      </ul>
    </template>
  </li>
</template>
