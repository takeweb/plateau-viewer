# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # 本番ビルド
pnpm generate     # 静的サイト生成 (Vercel向け)
pnpm typecheck    # 型チェック (nuxt prepare が先に必要)
pnpm test         # Vitest でテスト実行
pnpm test:watch   # ウォッチモード
pnpm lint         # Biome でlint
pnpm lint:fix     # Biome で自動修正
pnpm format       # Biome でフォーマット
```

単一テストファイルの実行:
```bash
pnpm vitest run tests/composables/usePlateau.test.ts
```

型チェックは `.nuxt/` が必要なため、クリーン環境では先に実行:
```bash
pnpm exec nuxt prepare && pnpm typecheck
```

## 環境変数

`.env.example` を `.env` にコピーして設定する。

| 変数 | 説明 |
|------|------|
| `NUXT_PUBLIC_CESIUM_ION_TOKEN` | Cesium ion アクセストークン (https://ion.cesium.com/tokens) |
| `NUXT_PUBLIC_PLATEAU_ASSETS` | レイヤー定義のJSON配列 (下記参照) |

`NUXT_PUBLIC_PLATEAU_ASSETS` のフォーマット:
```json
[{"id":"buildings","name":"建物モデル","assetId":2275207,"visible":true}]
```
`assetId` は Cesium ion 上のアセットID。`0` を設定するとそのレイヤーはスキップされる。

## アーキテクチャ

### Cesium ion データ取得フロー

deck.gl 向けの `@loaders.gl/cesium-ion` パッケージは存在しないため、Cesium ion REST API を直接叩くアプローチを採用している。

```
useCesiumIon.ts
  → GET https://api.cesium.com/v1/assets/{assetId}/endpoint (Bearer token)
  → レスポンスの url + accessToken から署名済みtileset URLを構築
  → DeckMap.vue の Tile3DLayer へ渡す
```

`resolvePlaateauAssets()` は `Promise.allSettled` で複数アセットを並列解決し、一部が失敗しても成功分のみ返す。

### 描画レイヤー構成

`DeckMap.vue` が deck.gl の `Deck` インスタンスをVueのライフサイクルで管理する。

- **base-map**: `TileLayer` + `BitmapLayer` で OpenStreetMap タイルを背景表示
- **plateau-{id}**: `Tile3DLayer` + `Tiles3DLoader` で Cesium ion の PLATEAU 3D Tiles を表示

`buildLayers()` は `resolvedAssets`（Cesium ion から解決済みのURL）と `visibleLayers`（ユーザーが表示ONにしたレイヤー）の積集合でレイヤー配列を組み立てる。レイヤー切替時は `initializePlateau()` を再実行してCesium ion APIを再叩きする。

### 状態管理

Pinia等は使用せず、Nuxt の composable パターンで管理:

- `usePlateau()` — `useState` でSSR対応のレイヤー設定を保持。`NUXT_PUBLIC_PLATEAU_ASSETS` のJSONをパースして初期化。
- `useViewState()` — 通常の `ref` でカメラ位置を管理。都市プリセット (`CITY_PRESETS`) への移動もここに集約。
- `useCesiumIon.ts` — composable ではなく純粋な async 関数としてexport。

### SSR対応

deck.gl はブラウザのWebGL APIを必要とするため、`DeckMap.vue` は `pages/index.vue` で `<ClientOnly>` でラップしている。`nuxt.config.ts` の `vite.ssr.noExternal` で deck.gl / loaders.gl をSSRバンドルから除外している。

## テストパターン

`@nuxt/test-utils/runtime` の `mockNuxtImport` で Nuxt composable をモックする。`useState` はNuxtインスタンスを要求するため、テストファイルの先頭でモックが必要:

```typescript
mockNuxtImport('useState', () => (_key: string, init?: () => unknown) => {
  return ref(typeof init === 'function' ? init() : init)
})
```

コンポーネントのテストではなく composable のロジックをユニットテストする方針。`DeckMap.vue` 等のWebGL依存コンポーネントはテスト対象外。

## デプロイ

`vercel.json` で東京リージョン (`nrt1`) を指定。Vercel の Environment Variables に `cesium-ion-token` と `plateau-assets` をSecret名で登録すること。
