import { describe, expect, it } from 'vitest'
import { createD1SeedSql } from '../../src/rag/d1-seed-sql'
import type { IndexPlan } from '../../src/rag/index-plan'

describe('createD1SeedSql', () => {
  it('index runとdocumentとchunkのseed SQLを生成する', () => {
    const sql = createD1SeedSql(createPlan())

    expect(sql).toContain("DELETE FROM chunks WHERE index_version = 'rag-bge-m3-v1';")
    expect(sql).toContain('INSERT INTO index_runs')
    expect(sql).toContain('INSERT INTO documents')
    expect(sql).toContain('INSERT INTO chunks')
    expect(sql).toContain("'rag-bge-m3-v1__remote-work-policy__s1__c1'")
  })

  it('D1 importで拒否されるtransaction statementを生成しない', () => {
    const sql = createD1SeedSql(createPlan())

    expect(sql).not.toContain('BEGIN TRANSACTION')
    expect(sql).not.toContain('COMMIT')
    expect(sql).not.toContain('SAVEPOINT')
  })

  it('文字列内のsingle quoteをSQL literalとしてescapeする', () => {
    const plan = createPlan()
    plan.documents[0].title = "リモート勤務's規程"

    expect(createD1SeedSql(plan)).toContain("'リモート勤務''s規程'")
  })

  it('有限でない数値なら例外を投げる', () => {
    const plan = createPlan()
    plan.chunks[0].chunk_order = Number.NaN

    expect(() => createD1SeedSql(plan)).toThrow('SQL numeric value must be finite')
  })
})

function createPlan(): IndexPlan {
  return {
    indexRun: {
      index_run_id: 'seed-rag-bge-m3-v1',
      index_version: 'rag-bge-m3-v1',
      embedding_model: '@cf/baai/bge-m3',
      vectorize_index_name: 'rag-bge-m3-v1',
      status: 'succeeded',
      started_at: '2026-05-01T00:00:00.000Z',
      completed_at: '2026-05-01T00:00:00.000Z',
      error_code: null,
      notes: null
    },
    documents: [
      {
        document_id: 'remote-work-policy',
        slug: 'remote-work-policy',
        title: 'リモート勤務規程',
        category: 'policy',
        document_hash: 'hash001',
        active_index_version: 'rag-bge-m3-v1',
        created_at: '2026-05-01T00:00:00.000Z',
        updated_at: '2026-05-01T00:00:00.000Z'
      }
    ],
    chunks: [
      {
        chunk_record_id: 'rag-bge-m3-v1__remote-work-policy__s1__c1',
        chunk_id: 'remote-work-policy__s1__c1',
        document_id: 'remote-work-policy',
        index_run_id: 'seed-rag-bge-m3-v1',
        index_version: 'rag-bge-m3-v1',
        chunk_order: 1,
        heading_path: JSON.stringify(['対象と申請']),
        content: 'リモート勤務は前営業日の十八時までに申請します。',
        content_hash: 'chunkhash001',
        char_count: 24,
        estimated_token_count: 24,
        active: 1,
        metadata_json: JSON.stringify({
          tags: ['policy', 'remote'],
          headingPath: ['対象と申請']
        }),
        created_at: '2026-05-01T00:00:00.000Z'
      }
    ]
  }
}
