import { describe, expect, it } from 'vitest'
import {
  createVectorizeIndexRecords,
  createVectorizeIndexSummary,
  createWorkersAiFixtureEmbeddingTexts,
  serializeVectorizeIndexNdjson
} from '../../src/rag/vectorize-index-files'
import type { ChunkRecord } from '../../src/rag/index-plan'

const chunk: ChunkRecord = {
  chunk_record_id: 'rag-bge-m3-v1__remote-work-policy__s1__c1',
  chunk_id: 'remote-work-policy__s1__c1',
  document_id: 'remote-work-policy',
  index_run_id: 'seed-rag-bge-m3-v1',
  index_version: 'rag-bge-m3-v1',
  chunk_order: 1,
  heading_path: '["対象と申請"]',
  content: 'リモート勤務は前営業日の十八時までに申請します。',
  content_hash: 'abcd1234',
  char_count: 25,
  estimated_token_count: 25,
  active: 1,
  metadata_json: JSON.stringify({
    documentSlug: 'remote-work-policy',
    documentTitle: 'リモート勤務規程',
    category: 'policy',
    tags: ['policy', 'remote'],
    headingPath: ['対象と申請'],
    charCount: 25
  }),
  created_at: '2026-05-01T00:00:00.000Z'
}

describe('createWorkersAiFixtureEmbeddingTexts', () => {
  it('chunk本文だけをembedding対象として返す', () => {
    expect(createWorkersAiFixtureEmbeddingTexts([chunk])).toEqual([
      'リモート勤務は前営業日の十八時までに申請します。'
    ])
  })

  it('chunkが空なら例外を投げる', () => {
    expect(() => createWorkersAiFixtureEmbeddingTexts([])).toThrow('fixture chunks are required')
  })
})

describe('createVectorizeIndexRecords', () => {
  it('chunk recordとembedding vectorからVectorize upsert recordを作る', () => {
    expect(createVectorizeIndexRecords({
      chunks: [chunk],
      vectors: [[0.1, 0.2, 0.3]],
      indexRunId: 'seed-rag-bge-m3-v1'
    })).toEqual([
      {
        id: 'remote-work-policy__s1__c1',
        values: [0.1, 0.2, 0.3],
        metadata: {
          chunkId: 'remote-work-policy__s1__c1',
          documentSlug: 'remote-work-policy',
          documentTitle: 'リモート勤務規程',
          category: 'policy',
          indexVersion: 'rag-bge-m3-v1',
          headingPath: ['対象と申請'],
          tags: ['policy', 'remote'],
          contentHash: 'abcd1234',
          indexRunId: 'seed-rag-bge-m3-v1'
        }
      }
    ])
  })

  it('chunk数とvector数が違う場合は例外を投げる', () => {
    expect(() => createVectorizeIndexRecords({
      chunks: [chunk],
      vectors: [],
      indexRunId: 'seed-rag-bge-m3-v1'
    })).toThrow('chunk and vector counts must match')
  })
})

describe('serializeVectorizeIndexNdjson', () => {
  it('Vectorize upsert recordをNDJSONに変換する', () => {
    const records = createVectorizeIndexRecords({
      chunks: [chunk],
      vectors: [[0.1, 0.2, 0.3]],
      indexRunId: 'seed-rag-bge-m3-v1'
    })

    expect(serializeVectorizeIndexNdjson(records)).toBe('{"id":"remote-work-policy__s1__c1","values":[0.1,0.2,0.3],"metadata":{"chunkId":"remote-work-policy__s1__c1","documentSlug":"remote-work-policy","documentTitle":"リモート勤務規程","category":"policy","indexVersion":"rag-bge-m3-v1","headingPath":["対象と申請"],"tags":["policy","remote"],"contentHash":"abcd1234","indexRunId":"seed-rag-bge-m3-v1"}}\n')
  })
})

describe('createVectorizeIndexSummary', () => {
  it('Vectorize upsert recordのsummaryを作る', () => {
    const records = createVectorizeIndexRecords({
      chunks: [chunk],
      vectors: [[0.1, 0.2, 0.3]],
      indexRunId: 'seed-rag-bge-m3-v1'
    })

    expect(createVectorizeIndexSummary(records, 'seed-rag-bge-m3-v1')).toEqual({
      indexRunId: 'seed-rag-bge-m3-v1',
      indexVersion: 'rag-bge-m3-v1',
      vectorCount: 1,
      chunkIds: ['remote-work-policy__s1__c1']
    })
  })
})
