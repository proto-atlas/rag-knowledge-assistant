import { describe, expect, it } from 'vitest'
import { app } from '../../src/worker/app'
import type { D1ActiveChunkRow, D1DatabaseLike } from '../../src/rag/d1-source'
import type { WorkerBindings } from '../../src/worker/types'

const enabledEnv: WorkerBindings = {
  RAG_ENABLE_PROVIDER_CHECK: 'true',
  RAG_ADMIN_ACCESS_KEY: 'admin-key',
  RAG_ACTIVE_INDEX_VERSION: 'rag-bge-m3-v1',
  RAG_DB: createFakeD1Database([
    {
      chunk_id: 'remote-work-policy__s1__c1',
      document_slug: 'remote-work-policy',
      document_title: 'リモート勤務ポリシー',
      document_category: 'policy',
      index_version: 'rag-bge-m3-v1',
      heading_path: '["申請期限"]',
      content: 'リモート勤務を希望するメンバーは、開始希望日の3営業日前までに申請フォームを提出します。',
      metadata_json: '{"tags":["policy"],"headingPath":["申請期限"]}'
    }
  ])
}

describe('POST /api/internal/d1-check', () => {
  it('明示フラグがない場合は404を返す', async () => {
    const response = await app.request('/api/internal/d1-check', {
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
    const response = await app.request('/api/internal/d1-check', {
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

  it('admin確認用キーが正しいとD1 check結果を返す', async () => {
    const response = await app.request('/api/internal/d1-check', {
      method: 'POST',
      headers: {
        authorization: 'Bearer admin-key'
      }
    }, enabledEnv)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      indexVersion: 'rag-bge-m3-v1',
      requestedChunkIds: [
        'remote-work-policy__s1__c1',
        'security-handbook__s3__c1',
        'release-process__s1__c1'
      ],
      foundCount: 1
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
