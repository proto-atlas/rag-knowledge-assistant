import { describe, expect, it } from 'vitest'
import { mockSearchCorpus } from '../../src/rag/mock-corpus'
import {
  DEFAULT_VECTORIZE_SMOKE_QUERY,
  createVectorizeSmokeRecords,
  createVectorizeSmokeSummary,
  createWorkersAiEmbeddingBatchRequest,
  parseWorkersAiEmbeddingVectors,
  selectVectorizeSmokeChunks,
  serializeVectorizeSmokeNdjson
} from '../../src/rag/vectorize-smoke'

describe('selectVectorizeSmokeChunks', () => {
  it('smoke用chunkを固定順で選びindexVersionをprovider用に置き換える', () => {
    const chunks = selectVectorizeSmokeChunks(mockSearchCorpus)

    expect(chunks.map((chunk) => chunk.chunkId)).toEqual([
      'remote-work-policy__s1__c1',
      'security-handbook__s3__c1',
      'release-process__s1__c1'
    ])
    expect(chunks.map((chunk) => chunk.indexVersion)).toEqual([
      'rag-bge-m3-v1',
      'rag-bge-m3-v1',
      'rag-bge-m3-v1'
    ])
  })
})

describe('createWorkersAiEmbeddingBatchRequest', () => {
  it('chunk本文と質問を同じWorkers AI embedding requestにまとめる', () => {
    const chunks = selectVectorizeSmokeChunks(mockSearchCorpus)
    const request = createWorkersAiEmbeddingBatchRequest({
      chunks,
      queryText: DEFAULT_VECTORIZE_SMOKE_QUERY
    })

    expect(request.text).toHaveLength(4)
    expect(request.text[0]).toBe(chunks[0]?.content)
    expect(request.text[3]).toBe('リモート勤務の申請期限は？')
    expect(request.truncate_inputs).toBe(false)
  })

  it('質問が空なら例外を投げる', () => {
    const chunks = selectVectorizeSmokeChunks(mockSearchCorpus)

    expect(() => createWorkersAiEmbeddingBatchRequest({
      chunks,
      queryText: '   '
    })).toThrow('query text is required')
  })
})

describe('parseWorkersAiEmbeddingVectors', () => {
  it('REST wrapper付きWorkers AI応答から複数vectorを取り出す', () => {
    expect(parseWorkersAiEmbeddingVectors({
      result: {
        data: [
          [0.1, 0.2],
          [0.3, 0.4]
        ]
      }
    })).toEqual([
      [0.1, 0.2],
      [0.3, 0.4]
    ])
  })

  it('vectorに有限でない値があれば例外を投げる', () => {
    expect(() => parseWorkersAiEmbeddingVectors({
      data: [
        [0.1, Number.NaN]
      ]
    })).toThrow('embedding vector contains invalid values')
  })
})

describe('createVectorizeSmokeRecords', () => {
  it('Vectorize upsert用recordを作る', () => {
    const chunks = selectVectorizeSmokeChunks(mockSearchCorpus).slice(0, 2)
    const records = createVectorizeSmokeRecords({
      chunks,
      vectors: [
        [0.1, 0.2],
        [0.3, 0.4]
      ],
      smokeRunId: 'smoke-2026-04-30'
    })

    expect(records).toEqual([
      {
        id: 'remote-work-policy__s1__c1',
        values: [0.1, 0.2],
        metadata: {
          chunkId: 'remote-work-policy__s1__c1',
          documentSlug: 'remote-work-policy',
          documentTitle: 'リモート勤務規程',
          category: 'policy',
          indexVersion: 'rag-bge-m3-v1',
          headingPath: ['対象と申請'],
          tags: ['policy', 'remote', 'attendance'],
          smokeRunId: 'smoke-2026-04-30'
        }
      },
      {
        id: 'security-handbook__s3__c1',
        values: [0.3, 0.4],
        metadata: {
          chunkId: 'security-handbook__s3__c1',
          documentSlug: 'security-handbook',
          documentTitle: 'セキュリティハンドブック',
          category: 'security',
          indexVersion: 'rag-bge-m3-v1',
          headingPath: ['外部共有'],
          tags: ['security', 'sharing', 'repository'],
          smokeRunId: 'smoke-2026-04-30'
        }
      }
    ])
  })

  it('chunk数とvector数が違えば例外を投げる', () => {
    const chunks = selectVectorizeSmokeChunks(mockSearchCorpus).slice(0, 2)

    expect(() => createVectorizeSmokeRecords({
      chunks,
      vectors: [
        [0.1, 0.2]
      ],
      smokeRunId: 'smoke-2026-04-30'
    })).toThrow('smoke chunk and vector counts must match')
  })
})

describe('serializeVectorizeSmokeNdjson', () => {
  it('Vectorize CLI用NDJSONを生成する', () => {
    expect(serializeVectorizeSmokeNdjson([
      {
        id: 'chunk-1',
        values: [0.1, 0.2],
        metadata: {
          chunkId: 'chunk-1',
          documentSlug: 'doc-1',
          documentTitle: 'Doc 1',
          category: 'policy',
          indexVersion: 'rag-bge-m3-v1',
          headingPath: ['Heading'],
          tags: ['policy'],
          smokeRunId: 'smoke'
        }
      }
    ])).toBe('{"id":"chunk-1","values":[0.1,0.2],"metadata":{"chunkId":"chunk-1","documentSlug":"doc-1","documentTitle":"Doc 1","category":"policy","indexVersion":"rag-bge-m3-v1","headingPath":["Heading"],"tags":["policy"],"smokeRunId":"smoke"}}\n')
  })
})

describe('createVectorizeSmokeSummary', () => {
  it('smoke概要を作る', () => {
    expect(createVectorizeSmokeSummary({
      records: [
        {
          id: 'chunk-1',
          values: [0.1, 0.2],
          metadata: {
            chunkId: 'chunk-1',
            documentSlug: 'doc-1',
            documentTitle: 'Doc 1',
            category: 'policy',
            indexVersion: 'rag-bge-m3-v1',
            headingPath: ['Heading'],
            tags: ['policy'],
            smokeRunId: 'smoke'
          }
        }
      ],
      queryText: '質問',
      queryVector: [0.3, 0.4],
      smokeRunId: 'smoke'
    })).toEqual({
      smokeRunId: 'smoke',
      indexVersion: 'rag-bge-m3-v1',
      chunkIds: ['chunk-1'],
      vectorCount: 1,
      queryText: '質問',
      queryVectorDimensions: 2
    })
  })
})
