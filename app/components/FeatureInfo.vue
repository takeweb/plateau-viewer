<script setup lang="ts">
import type { PlateauFeature } from '~/composables/usePlateau'

const props = defineProps<{ feature: PlateauFeature }>()
defineEmits<{ close: [] }>()

// PLATEAU 標準属性の日本語ラベル (該当しなければそのまま key を表示)
const LABELS: Record<string, string> = {
  'bldg:measuredHeight': '計測高さ (m)',
  'bldg:storeysAboveGround': '地上階数',
  'bldg:storeysBelowGround': '地下階数',
  'bldg:usage': '建物用途',
  'gml:name': '名称',
  gid: 'ID',
}

const displayProps = computed(() => {
  const source = (props.feature?.properties ?? {}) as Record<string, unknown>
  return Object.entries(source)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({
      label: LABELS[key] ?? key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
})
</script>

<template>
  <div class="bg-white text-gray-900 border border-gray-300 rounded-lg shadow-lg w-80 p-4 space-y-2 max-h-[60vh] overflow-y-auto">
    <div class="flex items-center justify-between sticky top-0 bg-white pb-2">
      <h3 class="text-sm font-semibold text-sky-600">建物情報</h3>
      <button
        class="text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="閉じる"
        @click="$emit('close')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div v-if="displayProps.length > 0" class="space-y-1.5">
      <div
        v-for="{ label, value } in displayProps"
        :key="label"
        class="flex justify-between text-xs gap-4"
      >
        <span class="text-gray-500 flex-shrink-0">{{ label }}</span>
        <span class="text-gray-900 text-right break-all">{{ value }}</span>
      </div>
    </div>

    <p v-else class="text-sm text-gray-500">属性情報がありません</p>
  </div>
</template>
