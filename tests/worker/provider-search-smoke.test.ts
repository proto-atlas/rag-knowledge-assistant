import { describe, expect, it } from 'vitest'
import { runProviderSearchSmoke } from '../../src/worker/provider-search-smoke'
import type { D1ActiveChunkRow, D1BoundValue, D1DatabaseLike } from '../../src/rag/d1-source'
import type { WorkerBindings } from '../../src/worker/types'

describe('runProviderSearchSmoke', () => {
  it('Workers AI、Vectorize、D1を結合してsource card用の検索結果を返す', async () => {
    const calls: unknown[] = []
    const env: WorkerBindings = {
      RAG_ACTIVE_INDEX_VERSION: 'rag-bge-m3-v1',
      AI: {
        run: async (model, input) => {
          calls.push({ type: 'ai', model, input })

          return {
            data: [
              [0.1, 0.2, 0.3]
            ]
          }
        }
      },
      RAG_VECTOR_INDEX: {
        query: async (vector, options) => {
          calls.push({ type: 'vectorize', vector, options })

          return {
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
          }
        }
      },
      RAG_DB: createFakeD1Database(calls, [
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

    await expect(runProviderSearchSmoke(env)).resolves.toEqual({
      ok: true,
      model: '@cf/baai/bge-m3',
      indexVersion: 'rag-bge-m3-v1',
      queryText: 'リモート勤務の申請期限は？',
      queryVectorDimensions: 3,
      vectorMatchCount: 1,
      d1FoundCount: 1,
      response: {
        query: 'リモート勤務の申請期限は？',
        topK: 3,
        indexVersion: 'rag-bge-m3-v1',
        noAnswerRecommended: false,
        results: [
          {
            sourceId: '1',
            chunkId: 'remote-work-policy__s1__c1',
            documentSlug: 'remote-work-policy',
            documentTitle: 'リモート勤務規程',
            headingPath: ['対象と申請'],
            excerpt: 'リモート勤務は、開始希望日の前営業日十八時までに勤務予定を提出します。',
            category: 'policy',
            tags: ['policy'],
            score: 0.91
          }
        ]
      }
    })
    expect(calls).toEqual([
      {
        type: 'ai',
        model: '@cf/baai/bge-m3',
        input: {
          text: ['リモート勤務の申請期限は？'],
          truncate_inputs: false
        }
      },
      {
        type: 'vectorize',
        vector: [0.1, 0.2, 0.3],
        options: {
          topK: 3,
          returnMetadata: 'all',
          filter: {
            indexVersion: {
              $eq: 'rag-bge-m3-v1'
            },
            category: {
              $eq: 'policy'
            }
          }
        }
      },
      {
        type: 'd1-bind',
        values: [
          'rag-bge-m3-v1',
          'remote-work-policy__s1__c1'
        ]
      }
    ])
  })

  it('provider search smokeに必要なbindingが足りなければ例外を投げる', async () => {
    await expect(runProviderSearchSmoke({})).rejects.toThrow('provider search smoke bindings are missing')
  })
})

function createFakeD1Database(calls: unknown[], rows: D1ActiveChunkRow[]): D1DatabaseLike {
  return {
    prepare: () => ({
      bind: (...values: D1BoundValue[]) => {
        calls.push({ type: 'd1-bind', values })

        return {
          all: async <T>() => ({
            results: rows as T[]
          })
        }
      }
    })
  }
}
