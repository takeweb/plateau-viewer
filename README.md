# PLATEAU 3D ビューワー

国土交通省の[Project PLATEAU](https://www.mlit.go.jp/plateau/)が提供する3D都市モデルを、ブラウザ上でインタラクティブに可視化するWebアプリです。

## 技術スタック

| カテゴリ | 採用技術 |
|----------|----------|
| フレームワーク | Nuxt 4 |
| 3D描画 | deck.gl v9 |
| スタイリング | TailwindCSS |
| テスト | Vitest |
| Lint / Format | Biome |
| デプロイ | Vercel |
| パッケージマネージャ | pnpm |

## セットアップ

### 1. 依存パッケージのインストール

```bash
pnpm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集して以下を設定します。

**`NUXT_PUBLIC_CESIUM_ION_TOKEN`**
[Cesium ion](https://ion.cesium.com/tokens) でアカウントを作成し、アクセストークンを取得してください。

**`NUXT_PUBLIC_PLATEAU_ASSETS`**
表示したい PLATEAU データセットの Cesium ion アセットIDを JSON 配列で指定します。

```env
NUXT_PUBLIC_CESIUM_ION_TOKEN=your_token_here

NUXT_PUBLIC_PLATEAU_ASSETS='[
  {"id":"buildings","name":"建物モデル","assetId":2275207,"visible":true},
  {"id":"terrain","name":"地形モデル","assetId":2275208,"visible":false}
]'
```

> **PLATEAU データの入手方法**
> [PLATEAU VIEW](https://plateauview.mlit.go.jp/) や Cesium ion のアセットマーケットプレイスから公開アセットを検索するか、[G空間情報センター](https://front.geospatial.jp/plateau/)からダウンロードしたデータを Cesium ion にアップロードしてアセットIDを取得してください。

### 3. 開発サーバーの起動

```bash
pnpm dev
```

## 主要コマンド

```bash
pnpm dev          # 開発サーバー起動 (http://localhost:3000)
pnpm build        # 本番ビルド
pnpm generate     # 静的サイト生成
pnpm preview      # ビルド結果のプレビュー
pnpm typecheck    # 型チェック
pnpm test         # テスト実行
pnpm lint:fix     # Lint & 自動修正
pnpm format       # フォーマット
```

## 操作方法

| 操作 | アクション |
|------|-----------|
| ドラッグ | 移動 |
| 右ドラッグ / Ctrl+ドラッグ | 視点回転 |
| スクロール | ズーム |
| 建物クリック | 属性情報を表示 |

左パネルからレイヤーの表示/非表示を切り替え、都市プリセットで各地に移動できます。

## デプロイ (Vercel)

```bash
pnpm generate
```

Vercel のプロジェクト設定で以下の Environment Variables を登録してください（`vercel.json` でSecret名を参照しています）。

| Secret名 | 対応する環境変数 |
|----------|----------------|
| `cesium-ion-token` | `NUXT_PUBLIC_CESIUM_ION_TOKEN` |
| `plateau-assets` | `NUXT_PUBLIC_PLATEAU_ASSETS` |

## ライセンス

MIT
