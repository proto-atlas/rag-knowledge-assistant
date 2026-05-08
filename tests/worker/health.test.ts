import { describe, expect, it } from 'vitest'
import { app } from '../../src/worker/app'

describe('GET /api/health', () => {
  it('ヘルスチェックを呼ぶとサービス名とokを返す', async () => {
    const response = await app.request('/api/health')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      service: 'rag-knowledge-assistant'
    })
  })
})
