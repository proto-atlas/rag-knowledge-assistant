import { describe, expect, it } from 'vitest'
import {
  getActiveChunksByIds,
  parseD1ActiveChunkRow,
  type D1ActiveChunkRow,
  type D1BoundValue,
  type D1DatabaseLike
} from '../../src/rag/d1-source'

const d1Row: D1ActiveChunkRow = {
  chunk_id: 'remote-work-policy__s1__c1',
  document_slug: 'remote-work-policy',
  document_title: 'リモート勤務規程',
  document_category: 'policy',
  index_version: 'rag-bge-m3-v1',
  heading_path: JSON.stringify(['対象と申請']),
  content: 'リモート勤務は前営業日の十八時までに勤務予定を登録します。',
  metadata_json: JSON.stringify({
    tags: ['policy', 'remote', 'attendance'],
    headingPath: ['対象と申請']
  })
}

describe('parseD1ActiveChunkRow', () => {
  it('D1行をsource card用chunkへ変換する', () => {
    expect(parseD1ActiveChunkRow(d1Row)).toEqual({
      chunkId: 'remote-work-policy__s1__c1',
      documentSlug: 'remote-work-policy',
      documentTitle: 'リモート勤務規程',
      category: 'policy',
      tags: ['policy', 'remote', 'attendance'],
      headingPath: ['対象と申請'],
      content: 'リモート勤務は前営業日の十八時までに勤務予定を登録します。',
      indexVersion: 'rag-bge-m3-v1'
    })
  })

  it('categoryが不正なら例外を投げる', () => {
    expect(() => parseD1ActiveChunkRow({
      ...d1Row,
      document_category: 'unknown'
    })).toThrow('D1 document category is invalid')
  })

  it('metadata_jsonがobjectでなければ例外を投げる', () => {
    expect(() => parseD1ActiveChunkRow({
      ...d1Row,
      metadata_json: JSON.stringify(['policy'])
    })).toThrow('D1 chunk metadata_json must be an object')
  })

  it('heading_pathが文字列配列でなければ例外を投げる', () => {
    expect(() => parseD1ActiveChunkRow({
      ...d1Row,
      heading_path: JSON.stringify([123])
    })).toThrow('D1 chunk heading_path must be a string array')
  })
})

describe('getActiveChunksByIds', () => {
  it('active indexVersionとchunk idをbindしてD1からchunkを取得する', async () => {
    const db = createFakeD1([d1Row])
    const chunks = await getActiveChunksByIds(
      db,
      ['remote-work-policy__s1__c1', 'security-handbook__s3__c1'],
      'rag-bge-m3-v1'
    )

    expect(db.preparedSql).toContain('c.index_version = ?')
    expect(db.preparedSql).toContain('c.chunk_id IN (?, ?)')
    expect(db.boundValues).toEqual([
      'rag-bge-m3-v1',
      'remote-work-policy__s1__c1',
      'security-handbook__s3__c1'
    ])
    expect(chunks.get('remote-work-policy__s1__c1')?.documentTitle).toBe('リモート勤務規程')
  })

  it('空白と重複したchunk idはD1へ渡さない', async () => {
    const db = createFakeD1([d1Row])
    await getActiveChunksByIds(
      db,
      [' remote-work-policy__s1__c1 ', '', 'remote-work-policy__s1__c1'],
      'rag-bge-m3-v1'
    )

    expect(db.preparedSql).toContain('c.chunk_id IN (?)')
    expect(db.boundValues).toEqual(['rag-bge-m3-v1', 'remote-work-policy__s1__c1'])
  })

  it('chunk idが空ならD1へ問い合わせず空のMapを返す', async () => {
    const db = createFakeD1([d1Row])
    const chunks = await getActiveChunksByIds(db, [' ', ''], 'rag-bge-m3-v1')

    expect(db.preparedSql).toBe('')
    expect(db.boundValues).toEqual([])
    expect(chunks.size).toBe(0)
  })

  it('active indexVersionが空なら例外を投げる', async () => {
    const db = createFakeD1([d1Row])

    await expect(getActiveChunksByIds(db, ['remote-work-policy__s1__c1'], '   '))
      .rejects
      .toThrow('activeIndexVersion is required')
  })
})

type FakeD1 = D1DatabaseLike & {
  preparedSql: string
  boundValues: D1BoundValue[]
}

function createFakeD1(rows: D1ActiveChunkRow[]): FakeD1 {
  const state = {
    preparedSql: '',
    boundValues: [] as D1BoundValue[]
  }

  return {
    get preparedSql() {
      return state.preparedSql
    },
    get boundValues() {
      return state.boundValues
    },
    prepare(query: string) {
      state.preparedSql = query

      return {
        bind(...values: D1BoundValue[]) {
          state.boundValues = values

          return {
            async all<T = unknown>() {
              return { results: rows as T[] }
            }
          }
        }
      }
    }
  }
}
