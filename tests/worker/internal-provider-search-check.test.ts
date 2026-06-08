import { describe, expect, it } from 'vitest'
import { app } from '../../src/worker/app'
import type { D1ActiveChunkRow, D1DatabaseLike } from '../../src/rag/d1-source'
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
            indexVersion: 'rag-bge-m3-v1'
          }
        }
      ]
    })
  },
  RAG_DB: createFakeD1Database([
    {
      chunk_id: 'remote-work-policy__s1__c1',
      document_slug: 'remote-work-policy',
      document_title: 'リモート勤務規程',
      document_category: 'policy',
      index_version: 'rag-bge-m3-v1',
      heading_path: '["対象と申請"]',
      content: 'リモート勤務は、開始希望日の前営業日十八時までに勤務予定を提出します。',
      metadata_json: '{"tags":["policy"],"headingPath":["対象と申請"]}'
    }
  ])
}

describe('POST /api/internal/provider-search-check', () => {
  it('明示フラグがない場合は404を返す', async () => {
    const response = await app.request('/api/internal/provider-search-check', {
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
    const response = await app.request('/api/internal/provider-search-check', {
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

  it('admin確認用キーが正しいとprovider search check結果を返す', async () => {
    const response = await app.request('/api/internal/provider-search-check', {
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
      vectorMatchCount: 1,
      d1FoundCount: 1,
      response: {
        noAnswerRecommended: false,
        results: [
          {
            chunkId: 'remote-work-policy__s1__c1',
            sourceId: '1'
          }
        ]
      }
    })
    expect(JSON.stringify(body)).not.toContain('admin-key')
  })
})

function createFakeD1Database(rows: D1ActiveChunkRow[]): D1DatabaseLike {
  return {
    prepare: () => ({
      bind: () => ({
        all: async <T>() => ({
          results: rows as T[]
        })
      })
    })
  }
}
