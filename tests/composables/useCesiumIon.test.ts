import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCesiumIonEndpoint, resolvePlaateauAssets } from '~/composables/useCesiumIon'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('fetchCesiumIonEndpoint', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('tilesetUrl と accessToken を返す', async () => {
    // 実際の Cesium Ion API は url フィールドに tileset.json のフル URL を返す
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        type: '3DTILES',
        url: 'https://assets.ion.cesium.com/depot/12345/tileset.json?v=1',
        accessToken: 'short-lived-token',
      }),
    })

    const result = await fetchCesiumIonEndpoint(12345, 'my-token')
    expect(result.tilesetUrl).toBe('https://assets.ion.cesium.com/depot/12345/tileset.json?v=1')
    expect(result.accessToken).toBe('short-lived-token')
  })

  it('クエリパラメータ付きの URL もそのまま返す', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        type: '3DTILES',
        url: 'https://assets.ion.cesium.com/depot/12345/tileset.json?v=2&region=ap',
        accessToken: 'token123',
      }),
    })

    const result = await fetchCesiumIonEndpoint(12345, 'my-token')
    expect(result.tilesetUrl).toBe('https://assets.ion.cesium.com/depot/12345/tileset.json?v=2&region=ap')
  })

  it('Authorization ヘッダーを正しく送信する', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://example.com/', accessToken: 'token' }),
    })

    await fetchCesiumIonEndpoint(99, 'bearer-token')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cesium.com/v1/assets/99/endpoint',
      { headers: { Authorization: 'Bearer bearer-token' } },
    )
  })

  it('API エラー時に詳細なメッセージで例外を投げる', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"message":"Invalid token"}',
    })

    await expect(fetchCesiumIonEndpoint(12345, 'bad-token')).rejects.toThrow(
      'Cesium ion API error (asset 12345): 401 Unauthorized',
    )
  })
})

describe('resolvePlaateauAssets', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('複数アセットを並列解決する', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://assets.cesium.com/1/', accessToken: 'tok' }),
    })

    const result = await resolvePlaateauAssets(
      [
        { id: 'buildings', name: '建物', assetId: 111 },
        { id: 'terrain', name: '地形', assetId: 222 },
      ],
      'my-token',
    )

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('buildings')
    expect(result[0].accessToken).toBe('tok')
    expect(result[1].id).toBe('terrain')
  })

  it('一部のアセットが失敗しても成功分を返す', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://assets.cesium.com/1/', accessToken: 'tok' }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', text: async () => '' })

    const result = await resolvePlaateauAssets(
      [
        { id: 'buildings', name: '建物', assetId: 111 },
        { id: 'missing', name: '存在しない', assetId: 999 },
      ],
      'my-token',
    )

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('buildings')
  })

  it('全アセットが失敗したときはエラーを投げる', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => '',
    })

    await expect(
      resolvePlaateauAssets([{ id: 'buildings', name: '建物', assetId: 111 }], 'bad-token'),
    ).rejects.toThrow('すべてのCesium ionアセットの取得に失敗しました')
  })
})
