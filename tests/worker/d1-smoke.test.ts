import { describe, expect, it } from 'vitest'
import { runD1SourceSmoke } from '../../src/worker/d1-smoke'
import type { D1ActiveChunkRow, D1BoundValue, D1DatabaseLike } from '../../src/rag/d1-source'
import type { WorkerBindings } from '../../src/worker/types'

describe('runD1SourceSmoke', () => {
  it('D1から既定chunkをactive indexVersionで取得して内容の概要を返す', async () => {
    const bindCalls: D1BoundValue[][] = []
    const db = createFakeD1Database(bindCalls, [
      createRow('remote-work-policy__s1__c1', 'remote-work-policy', 'リモート勤務ポリシー', 'policy', '["申請期限"]', 'リモート勤務を希望するメンバーは、開始希望日の3営業日前までに申請フォームを提出します。'),
      createRow('security-handbook__s3__c1', 'security-handbook', 'セキュリティハンドブック', 'security', '["端末紛失"]', '端末を紛失した場合は、発覚から30分以内にセキュリティ窓口へ連絡します。'),
      createRow('release-process__s1__c1', 'release-process', 'リリース手順', 'release', '["リリース判定"]', 'リリース判定では、テスト結果、監視項目、ロールバック手順を確認します。')
    ])
    const env: WorkerBindings = {
      RAG_DB: db,
      RAG_ACTIVE_INDEX_VERSION: 'rag-bge-m3-v1'
    }

    await expect(runD1SourceSmoke(env)).resolves.toEqual({
      ok: true,
      indexVersion: 'rag-bge-m3-v1',
      requestedChunkIds: [
        'remote-work-policy__s1__c1',
        'security-handbook__s3__c1',
        'release-process__s1__c1'
      ],
      foundCount: 3,
      chunks: [
        {
          chunkId: 'remote-work-policy__s1__c1',
          documentSlug: 'remote-work-policy',
          documentTitle: 'リモート勤務ポリシー',
          category: 'policy',
          headingPath: ['申請期限'],
          indexVersion: 'rag-bge-m3-v1',
          contentLength: 44,
          contentPreview: 'リモート勤務を希望するメンバーは、開始希望日の3営業日前までに申請フォームを提出します。'
        },
        {
          chunkId: 'security-handbook__s3__c1',
          documentSlug: 'security-handbook',
          documentTitle: 'セキュリティハンドブック',
          category: 'security',
          headingPath: ['端末紛失'],
          indexVersion: 'rag-bge-m3-v1',
          contentLength: 36,
          contentPreview: '端末を紛失した場合は、発覚から30分以内にセキュリティ窓口へ連絡します。'
        },
        {
          chunkId: 'release-process__s1__c1',
          documentSlug: 'release-process',
          documentTitle: 'リリース手順',
          category: 'release',
          headingPath: ['リリース判定'],
          indexVersion: 'rag-bge-m3-v1',
          contentLength: 35,
          contentPreview: 'リリース判定では、テスト結果、監視項目、ロールバック手順を確認します。'
        }
      ]
    })
    expect(bindCalls).toEqual([[
      'rag-bge-m3-v1',
      'remote-work-policy__s1__c1',
      'security-handbook__s3__c1',
      'release-process__s1__c1'
    ]])
  })

  it('D1 bindingが足りなければ例外を投げる', async () => {
    await expect(runD1SourceSmoke({})).rejects.toThrow('D1 smoke bindings are missing')
  })
})

function createFakeD1Database(bindCalls: D1BoundValue[][], rows: D1ActiveChunkRow[]): D1DatabaseLike {
  return {
    prepare: () => ({
      bind: (...values: D1BoundValue[]) => {
        bindCalls.push(values)

        return {
          all: async <T>() => ({
            results: rows as T[]
          })
        }
      }
    })
  }
}

function createRow(
  chunkId: string,
  documentSlug: string,
  documentTitle: string,
  category: string,
  headingPath: string,
  content: string
): D1ActiveChunkRow {
  return {
    chunk_id: chunkId,
    document_slug: documentSlug,
    document_title: documentTitle,
    document_category: category,
    index_version: 'rag-bge-m3-v1',
    heading_path: headingPath,
    content,
    metadata_json: JSON.stringify({
      tags: ['smoke'],
      headingPath: JSON.parse(headingPath) as string[]
    })
  }
}
