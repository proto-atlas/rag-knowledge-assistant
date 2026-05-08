import { describe, expect, it } from 'vitest'
import {
  createExternalBenchmarkInputHash,
  evaluateExternalBenchmarkRows,
  rankExternalDocuments,
  summarizeExternalBenchmarkRows
} from '../../src/rag/external-benchmark'
import type { ExternalBenchmarkDocument, ExternalBenchmarkQuery } from '../../src/rag/external-benchmark'

const documents: ExternalBenchmarkDocument[] = [
  {
    docId: 'gold-remote',
    title: 'リモート勤務制度',
    text: 'リモート勤務は前日までに申請し、上長の承認を受ける。'
  },
  {
    docId: 'finance-rule',
    title: '経費精算ルール',
    text: '五万円以上の経費は事前承認が必要。'
  },
  {
    docId: 'security-rule',
    title: 'セキュリティ研修',
    text: '公共Wi-Fiの利用時はVPNを使う。'
  }
]

describe('rankExternalDocuments', () => {
  it('NFKC正規化したqueryでtitle一致documentを先頭に返す', () => {
    const ranked = rankExternalDocuments('ﾘﾓｰﾄ勤務の申請は？', documents, 3)

    expect(ranked[0]).toEqual({
      docId: 'gold-remote',
      score: 27.5
    })
  })

  it('一致しないqueryでは空配列を返す', () => {
    expect(rankExternalDocuments('今日の天気は？', documents, 3)).toEqual([])
  })
})

describe('evaluateExternalBenchmarkRows', () => {
  it('expected documentがtop5に入るとfirstMatchRankを記録する', () => {
    const queries: ExternalBenchmarkQuery[] = [
      {
        id: 'q1',
        query: 'リモート勤務の申請は？',
        expectedDocIds: ['gold-remote']
      }
    ]

    expect(evaluateExternalBenchmarkRows(queries, documents, 5)[0]).toMatchObject({
      id: 'q1',
      firstMatchRank: 1,
      failureCategory: null
    })
  })

  it('expected documentがtopK外なら失敗分類を記録する', () => {
    const queries: ExternalBenchmarkQuery[] = [
      {
        id: 'q2',
        query: 'リモート勤務の申請は？',
        expectedDocIds: ['missing-doc']
      }
    ]

    expect(evaluateExternalBenchmarkRows(queries, documents, 5)[0]).toMatchObject({
      id: 'q2',
      firstMatchRank: null,
      failureCategory: 'domain_mismatch'
    })
  })
})

describe('summarizeExternalBenchmarkRows', () => {
  it('hit率とMRRを固定小数で集計する', () => {
    const rows = evaluateExternalBenchmarkRows([
      {
        id: 'q1',
        query: 'リモート勤務の申請は？',
        expectedDocIds: ['gold-remote']
      },
      {
        id: 'q2',
        query: '経費精算の承認は？',
        expectedDocIds: ['finance-rule']
      },
      {
        id: 'q3',
        query: '該当しない未知の質問',
        expectedDocIds: ['missing-doc']
      }
    ], documents, 10)

    expect(summarizeExternalBenchmarkRows(rows)).toEqual({
      total: 3,
      hitAt1: 0.667,
      hitAt5: 0.667,
      hitAt10: 0.667,
      mrr: 0.667,
      failed: 1,
      failureCategories: {
        domain_mismatch: 0,
        gold_granularity_mismatch: 0,
        long_query_drift: 0,
        normalization_gap: 0,
        synonym_gap: 0,
        zero_score: 1
      }
    })
  })
})

describe('createExternalBenchmarkInputHash', () => {
  it('queryとdocumentの順序が変わっても同じhashを返す', () => {
    const queries: ExternalBenchmarkQuery[] = [
      {
        id: 'q1',
        query: 'リモート勤務の申請は？',
        expectedDocIds: ['gold-remote']
      }
    ]

    const left = createExternalBenchmarkInputHash({
      queries,
      documents
    })
    const right = createExternalBenchmarkInputHash({
      queries: [...queries].reverse(),
      documents: [...documents].reverse()
    })

    expect(right).toBe(left)
  })
})
