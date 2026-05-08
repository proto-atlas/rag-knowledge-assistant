import { describe, expect, it } from 'vitest'
import type { D1ActiveChunkRow, D1DatabaseLike } from '../../src/rag/d1-source'
import type { SearchRequest } from '../../src/rag/search-types'
import {
  VECTORIZE_D1_SEARCH_PROVIDER_MODE,
  extractVectorizeChunkIds,
  parseProviderMinScore,
  runSearchProvider
} from '../../src/worker/search-provider'
import type { WorkerBindings } from '../../src/worker/types'

const request: SearchRequest = {
  question: 'リモート勤務の申請期限は？',
  topK: 3,
  category: 'policy'
}

describe('runSearchProvider', () => {
  it('provider modeが未指定ならmock検索を使う', async () => {
    const response = await runSearchProvider(request, {})

    expect(response.indexVersion).toBe('fixture-corpus-v1')
    expect(response.results[0]?.chunkId).toBe('remote-work-policy__s1__c1')
  })

  it('provider modeでbindingが不足していたら例外を投げる', async () => {
    await expect(runSearchProvider(request, {
      RAG_SEARCH_PROVIDER_MODE: VECTORIZE_D1_SEARCH_PROVIDER_MODE
    })).rejects.toThrow('vectorize d1 search provider bindings are missing')
  })

  it('provider modeならWorkers AI、Vectorize、D1をつなげて検索結果を返す', async () => {
    const vectorizeCalls: unknown[] = []
    const env: WorkerBindings = {
      RAG_SEARCH_PROVIDER_MODE: VECTORIZE_D1_SEARCH_PROVIDER_MODE,
      RAG_ACTIVE_INDEX_VERSION: 'rag-bge-m3-v1',
      AI: {
        run: async () => ({
          data: [
            [0.1, 0.2, 0.3]
          ]
        })
      },
      RAG_VECTOR_INDEX: {
        query: async (_vector, options) => {
          vectorizeCalls.push(options)

          return {
            matches: [
              {
                id: 'vector-1',
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

    const response = await runSearchProvider(request, env)

    expect(response).toMatchObject({
      query: 'リモート勤務の申請期限は？',
      topK: 3,
      indexVersion: 'rag-bge-m3-v1',
      noAnswerRecommended: false,
      results: [
        {
          sourceId: '1',
          chunkId: 'remote-work-policy__s1__c1',
          documentTitle: 'リモート勤務規程'
        }
      ]
    })
    expect(vectorizeCalls).toEqual([
      {
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
    ])
  })

  it('Vectorize結果がD1に存在しなければno-answer推奨で返す', async () => {
    const env: WorkerBindings = {
      RAG_SEARCH_PROVIDER_MODE: VECTORIZE_D1_SEARCH_PROVIDER_MODE,
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
              id: 'missing-chunk',
              score: 0.91
            }
          ]
        })
      },
      RAG_DB: createFakeD1Database([])
    }

    const response = await runSearchProvider(request, env)

    expect(response.results).toEqual([])
    expect(response.noAnswerRecommended).toBe(true)
  })

  it('provider modeのmin score envが高い場合はno-answer推奨にする', async () => {
    const env: WorkerBindings = {
      RAG_SEARCH_PROVIDER_MODE: VECTORIZE_D1_SEARCH_PROVIDER_MODE,
      RAG_ACTIVE_INDEX_VERSION: 'rag-bge-m3-v1',
      RAG_MIN_PROVIDER_VECTOR_SCORE: '0.95',
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
              id: 'vector-1',
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

    const response = await runSearchProvider(request, env)

    expect(response.results).toHaveLength(1)
    expect(response.noAnswerRecommended).toBe(true)
  })
})

describe('parseProviderMinScore', () => {
  it('未指定ならundefinedを返す', () => {
    expect(parseProviderMinScore(undefined)).toBeUndefined()
    expect(parseProviderMinScore('')).toBeUndefined()
  })

  it('0から1の数値文字列なら数値を返す', () => {
    expect(parseProviderMinScore('0.35')).toBe(0.35)
  })

  it('0なら数値を返す', () => {
    expect(parseProviderMinScore('0')).toBe(0)
  })

  it('1なら数値を返す', () => {
    expect(parseProviderMinScore('1')).toBe(1)
  })

  it('範囲外なら例外を投げる', () => {
    expect(() => parseProviderMinScore('-0.1')).toThrow('RAG_MIN_PROVIDER_VECTOR_SCORE is invalid')
    expect(() => parseProviderMinScore('1.1')).toThrow('RAG_MIN_PROVIDER_VECTOR_SCORE is invalid')
  })

  it('非数値なら例外を投げる', () => {
    expect(() => parseProviderMinScore('abc')).toThrow('RAG_MIN_PROVIDER_VECTOR_SCORE is invalid')
  })
})

describe('extractVectorizeChunkIds', () => {
  it('metadataのchunkIdがあればそれを優先して重複を除く', () => {
    expect(extractVectorizeChunkIds([
      {
        id: 'vector-1',
        score: 0.91,
        metadata: {
          chunkId: 'remote-work-policy__s1__c1'
        }
      },
      {
        id: 'remote-work-policy__s1__c1',
        score: 0.82
      }
    ])).toEqual(['remote-work-policy__s1__c1'])
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
