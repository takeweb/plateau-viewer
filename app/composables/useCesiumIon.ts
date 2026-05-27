interface CesiumIonEndpoint {
  type: string
  url: string
  accessToken: string
}

interface TilesetEndpoint {
  tilesetUrl: string
  accessToken: string
}

// Cesium ion の asset endpoint を叩いて tileset URL と asset accessToken を返す
export async function fetchCesiumIonEndpoint(assetId: number, token: string): Promise<TilesetEndpoint> {
  const res = await fetch(`https://api.cesium.com/v1/assets/${assetId}/endpoint`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `Cesium ion API error (asset ${assetId}): ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`,
    )
  }
  const data: CesiumIonEndpoint = await res.json()
  // data.url はすでに tileset.json へのフル URL (クエリパラメータ込み)
  return {
    tilesetUrl: data.url,
    accessToken: data.accessToken,
  }
}

export interface ResolvedAsset {
  id: string
  name: string
  tilesetUrl: string
  accessToken: string
}

// 複数アセットのエンドポイントをまとめて解決する
export async function resolvePlaateauAssets(
  assets: Array<{ id: string; name: string; assetId: number }>,
  token: string,
): Promise<ResolvedAsset[]> {
  const results = await Promise.allSettled(
    assets.map(async (asset) => {
      const endpoint = await fetchCesiumIonEndpoint(asset.assetId, token)
      return { id: asset.id, name: asset.name, ...endpoint }
    }),
  )

  const failures = results.filter((r) => r.status === 'rejected')
  if (failures.length > 0) {
    console.warn(
      '[plateau] 一部のアセット取得に失敗しました:',
      failures.map((r) => (r as PromiseRejectedResult).reason?.message),
    )
  }

  const resolved = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  if (resolved.length === 0 && assets.length > 0) {
    throw new Error('すべてのCesium ionアセットの取得に失敗しました。アセットIDとトークンを確認してください。')
  }
  return resolved
}
