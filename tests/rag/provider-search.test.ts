import { describe, expect, it } from 'vitest'
import { mockSearchCorpus } from '../../src/rag/mock-corpus'
import {
  createSearchResponseFromVectorMatches,
  createVectorizeQueryOptions,
  parseFirstWorkersAiEmbeddingVector,
  parseVectorizeMatches
} from '../../src/rag/provider-search'
import type { SearchRequest } from '../../src/rag/search-types'

const request: SearchRequest = {
  question: 'リモート勤務の申請期限は？',
  topK: 5
}

describe('createVectorizeQueryOptions', () => {
  it('active indexVersionをmetadata filterに必ず含める', () => {
    expect(createVectorizeQueryOptions(request, 'rag-bge-m3-v1')).toEqual({
      topK: 5,
      returnMetadata: 'all',
      filter: {
        indexVersion: {
          $eq: 'rag-bge-m3-v1'
        }
      }
    })
  })

  it('category指定があればmetadata filterに含める', () => {
    const categoryRequest: SearchRequest = {
      question: '五万円以上の承認は？',
      topK: 3,
      category: 'finance'
    }

    expect(createVectorizeQueryOptions(categoryRequest, 'rag-bge-m3-v1')).toEqual({
      topK: 3,
      returnMetadata: 'all',
      filter: {
        indexVersion: {
          $eq: 'rag-bge-m3-v1'
        },
        category: {
          $eq: 'finance'
        }
      }
    })
  })

  it('active indexVersionが空なら例外を投げる', () => {
    expect(() => createVectorizeQueryOptions(request, '   ')).toThrow('activeIndexVersion is required')
  })
})

describe('parseFirstWorkersAiEmbeddingVector', () => {
  it('data形式のWorkers AI embedding応答から最初のvectorを取り出す', () => {
    expect(parseFirstWorkersAiEmbeddingVector({
      data: [
        [0.1, -0.2, 0.3]
      ],
      shape: [1, 3],
      pooling: 'cls'
    })).toEqual([0.1, -0.2, 0.3])
  })

  it('response形式のWorkers AI embedding応答から最初のvectorを取り出す', () => {
    expect(parseFirstWorkersAiEmbeddingVector({
      response: [
        [0.4, 0.5]
      ],
      shape: [1, 2],
      pooling: 'mean'
    })).toEqual([0.4, 0.5])
  })

  it('embedding vectorに有限でない値があれば例外を投げる', () => {
    expect(() => parseFirstWorkersAiEmbeddingVector({
      data: [
        [0.1, Number.NaN]
      ]
    })).toThrow('Workers AI embedding vector contains invalid values')
  })
})

describe('parseVectorizeMatches', () => {
  it('Vectorize query応答からmatch一覧を検証して取り出す', () => {
    expect(parseVectorizeMatches({
      matches: [
        {
          id: 'vector-1',
          score: 0.82,
          metadata: {
            chunkId: 'remote-work-policy__s1__c1',
            documentSlug: 'remote-work-policy',
            category: 'policy',
            indexVersion: 'rag-bge-m3-v1',
            smokeRunId: 'vectorize-smoke-test'
          }
        }
      ]
    })).toEqual([
      {
        id: 'vector-1',
        score: 0.82,
        metadata: {
          chunkId: 'remote-work-policy__s1__c1',
          documentSlug: 'remote-work-policy',
          category: 'policy',
          indexVersion: 'rag-bge-m3-v1',
          smokeRunId: 'vectorize-smoke-test'
        }
      }
    ])
  })

  it('scoreが有限でなければ例外を投げる', () => {
    expect(() => parseVectorizeMatches({
      matches: [
        {
          id: 'vector-1',
          score: Number.POSITIVE_INFINITY
        }
      ]
    })).toThrow('Vectorize match score must be finite')
  })
})

describe('createSearchResponseFromVectorMatches', () => {
  const chunksById = new Map(mockSearchCorpus.map((chunk) => [chunk.chunkId, chunk]))

  it('Vectorize matchをsource card用の検索結果へ変換する', () => {
    const response = createSearchResponseFromVectorMatches({
      request,
      activeIndexVersion: 'fixture-corpus-v1',
      chunksById,
      matches: [
        {
          id: 'remote-work-policy__s1__c1',
          score: 0.91,
          metadata: {
            chunkId: 'remote-work-policy__s1__c1'
          }
        }
      ],
      minScore: 0.2
    })

    expect(response.results[0]?.chunkId).toBe('remote-work-policy__s1__c1')
    expect(response.results[0]?.sourceId).toBe('1')
    expect(response.noAnswerRecommended).toBe(false)
  })

  it('active indexVersionと違うchunkは検索結果に含めない', () => {
    const response = createSearchResponseFromVectorMatches({
      request,
      activeIndexVersion: 'rag-bge-m3-v1',
      chunksById,
      matches: [
        {
          id: 'remote-work-policy__s1__c1',
          score: 0.91
        }
      ],
      minScore: 0.2
    })

    expect(response.results).toEqual([])
    expect(response.noAnswerRecommended).toBe(true)
  })

  it('category指定と違うchunkは検索結果に含めない', () => {
    const response = createSearchResponseFromVectorMatches({
      request: {
        question: 'リモート勤務の申請期限は？',
        topK: 5,
        category: 'finance'
      },
      activeIndexVersion: 'fixture-corpus-v1',
      chunksById,
      matches: [
        {
          id: 'remote-work-policy__s1__c1',
          score: 0.91
        }
      ],
      minScore: 0.2
    })

    expect(response.results).toEqual([])
    expect(response.noAnswerRecommended).toBe(true)
  })
})
