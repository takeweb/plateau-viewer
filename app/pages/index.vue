<script setup lang="ts">
</script>

<template>
  <main class="w-full h-screen bg-gray-950 flex">
    <!-- サイドパネル -->
    <aside class="absolute top-4 left-4 z-50">
      <LayerPanel />
    </aside>

    <!-- 地図エリア (deck.gl はブラウザのみ動作) -->
    <ClientOnly>
      <DeckMap class="flex-1" />
      <template #fallback>
        <div class="flex-1 flex items-center justify-center text-gray-500">
          <p>地図を読み込み中...</p>
        </div>
      </template>
    </ClientOnly>
  </main>
</template>
