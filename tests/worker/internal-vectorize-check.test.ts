import { describe, expect, it } from 'vitest'
import { app } from '../../src/worker/app'
import type { WorkerBindings } from '../../src/worker/types'

const enabledEnv: WorkerBindings = {
  RAG_ENABLE_PROVIDER_CHECK: 'true',
  RAG_ADMIN_ACCESS_KEY: 'admin-key',
  RAG_ACTIVE_INDEX_VERSION: 'rag-bge-m3-v1',
  AI: {
    run: async () => ({
      data: [
        [0.1, 0.2, 0.3]
      ]
    })
  },
  RAG_VECTOR_INDEX: {
    query: async () => ({
      matches: [
        {
          id: 'remote-work-policy__s1__c1',
          score: 0.91,
          metadata: {
            chunkId: 'remote-work-policy__s1__c1',
            documentSlug: 'remote-work-policy',
            category: 'policy',
            indexVersion: 'rag-bge-m3-v1',
            checkRunId: 'vectorize-check-test'
          }
        }
      ]
    })
  }
}

describe('POST /api/internal/vectorize-check', () => {
  it('明示フラグがない場合は404を返す', async () => {
    const response = await app.request('/api/internal/vectorize-check', {
      method: 'POST',
      headers: {
        authorization: 'Bearer admin-key'
      }
    }, {
      ...enabledEnv,
      RAG_ENABLE_PROVIDER_CHECK: undefined
    })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: {
        code: 'not_found',
        message: '指定されたリソースは見つかりません。'
      }
    })
  })

  it('admin確認用キーがない場合は401を返す', async () => {
    const response = await app.request('/api/internal/vectorize-check', {
      method: 'POST'
    }, enabledEnv)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'admin確認用キーが必要です。'
      }
    })
  })

  it('admin確認用キーが正しいとprovider check結果を返す', async () => {
    const response = await app.request('/api/internal/vectorize-check', {
      method: 'POST',
      headers: {
        authorization: 'Bearer admin-key'
      }
    }, enabledEnv)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      model: '@cf/baai/bge-m3',
      indexVersion: 'rag-bge-m3-v1',
      queryVectorDimensions: 3,
      count: 1
    })
    expect(JSON.stringify(body)).not.toContain('admin-key')
  })
})
