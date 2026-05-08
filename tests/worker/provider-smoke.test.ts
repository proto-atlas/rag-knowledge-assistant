import { describe, expect, it } from 'vitest'
import { runProviderVectorizeSmoke } from '../../src/worker/provider-smoke'
import type { WorkerBindings } from '../../src/worker/types'

describe('runProviderVectorizeSmoke', () => {
  it('Workers AIで質問をembeddingしてVectorizeをmetadata filter付きでqueryする', async () => {
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
                  indexVersion: 'rag-bge-m3-v1',
                  smokeRunId: 'vectorize-smoke-test'
                }
              }
            ]
          }
        }
      }
    }

    await expect(runProviderVectorizeSmoke(env)).resolves.toEqual({
      ok: true,
      model: '@cf/baai/bge-m3',
      indexVersion: 'rag-bge-m3-v1',
      queryText: 'リモート勤務の申請期限は？',
      queryVectorDimensions: 3,
      filter: {
        indexVersion: 'rag-bge-m3-v1',
        category: 'policy'
      },
      count: 1,
      matches: [
        {
          id: 'remote-work-policy__s1__c1',
          score: 0.91,
          metadata: {
            chunkId: 'remote-work-policy__s1__c1',
            documentSlug: 'remote-work-policy',
            category: 'policy',
            indexVersion: 'rag-bge-m3-v1',
            smokeRunId: 'vectorize-smoke-test'
          }
        }
      ]
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
      }
    ])
  })

  it('provider bindingが足りなければ例外を投げる', async () => {
    await expect(runProviderVectorizeSmoke({})).rejects.toThrow('provider smoke bindings are missing')
  })
})
