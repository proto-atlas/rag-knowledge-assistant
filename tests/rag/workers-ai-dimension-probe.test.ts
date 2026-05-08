import { describe, expect, it } from 'vitest'
import {
  createWorkersAiDimensionProbeSummary,
  createWorkersAiEmbeddingProbeRequest,
  createWorkersAiRestUrl
} from '../../src/rag/workers-ai-dimension-probe'

describe('createWorkersAiEmbeddingProbeRequest', () => {
  it('probe用textを1件だけ含むWorkers AI入力を作る', () => {
    expect(createWorkersAiEmbeddingProbeRequest('  RAG probe  ')).toEqual({
      text: ['RAG probe'],
      truncate_inputs: false
    })
  })

  it('probe用textが空なら例外を投げる', () => {
    expect(() => createWorkersAiEmbeddingProbeRequest('   ')).toThrow('probe text is required')
  })
})

describe('createWorkersAiRestUrl', () => {
  it('Cloudflare Workers AI REST endpoint URLを作る', () => {
    expect(createWorkersAiRestUrl('account-123', '@cf/baai/bge-m3')).toBe(
      'https://api.cloudflare.com/client/v4/accounts/account-123/ai/run/%40cf/baai/bge-m3'
    )
  })

  it('account idが空なら例外を投げる', () => {
    expect(() => createWorkersAiRestUrl('   ', '@cf/baai/bge-m3')).toThrow('Cloudflare account id is required')
  })
})

describe('createWorkersAiDimensionProbeSummary', () => {
  it('REST wrapper付き応答からdimensionとmetadataを取り出す', () => {
    expect(createWorkersAiDimensionProbeSummary({
      success: true,
      result: {
        data: [
          [0.1, 0.2, 0.3, 0.4]
        ],
        shape: [1, 4],
        pooling: 'cls'
      }
    }, '@cf/baai/bge-m3')).toEqual({
      model: '@cf/baai/bge-m3',
      dimensions: 4,
      shape: [1, 4],
      pooling: 'cls'
    })
  })

  it('binding形式の応答からdimensionを取り出す', () => {
    expect(createWorkersAiDimensionProbeSummary({
      response: [
        [0.5, 0.6]
      ]
    })).toEqual({
      model: '@cf/baai/bge-m3',
      dimensions: 2
    })
  })
})
