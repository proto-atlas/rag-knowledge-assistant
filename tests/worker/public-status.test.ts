import { describe, expect, it } from 'vitest'
import { app } from '../../src/worker/app'

describe('GET /api/public/status', () => {
  it('公開ステータスを呼ぶと内部情報なしの初期状態を返す', async () => {
    const response = await app.request('/api/public/status')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      documentCount: 8,
      chunkCount: 24,
      indexVersion: 'fixture-corpus-v1',
      lastIndexedAt: null
    })
    expect(JSON.stringify(body)).not.toContain('C:\\')
    expect(JSON.stringify(body)).not.toContain('secret')
  })
})
