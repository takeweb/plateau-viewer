export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  ssr: false, // deck.gl は WebGL (ブラウザ専用) のため SSR 無効
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      cesiumIonToken: '',
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@deck.gl/core',
        '@deck.gl/geo-layers',
        '@deck.gl/layers',
        '@loaders.gl/3d-tiles',
      ],
    },
  },
})
