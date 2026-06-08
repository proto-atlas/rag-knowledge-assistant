import { describe, expect, it } from 'vitest'
import { searchKnowledgeBase, SearchApiError } from '../../src/client/search-api'
import type { SearchResponse } from '../../src/rag/search-types'

const successfulResponse: SearchResponse = {
  query: 'リモート勤務の申請期限は？',
  topK: 5,
  indexVersion: 'fixture-corpus-v1',
  noAnswerRecommended: false,
  results: [
    {
      sourceId: '1',
      chunkId: 'remote-work-policy-001',
      documentSlug: 'remote-work-policy',
      documentTitle: 'リモート勤務規程',
      headingPath: ['申請期限'],
      excerpt: 'リモート勤務は前営業日の十八時までに申請します。',
      category: 'policy',
      tags: ['policy', 'remote'],
      score: 6
    }
  ]
}

describe('searchKnowledgeBase', () => {
  it('検索に成功したら検証済みレスポンスを返す', async () => {
    const fetchCalls: RequestInit[] = []
    const fetchImpl = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCalls.push(init ?? {})
      return Response.json(successfulResponse)
    }

    const result = await searchKnowledgeBase({
      accessKey: 'test-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    }, fetchImpl)

    expect(result).toEqual(successfulResponse)
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0]?.headers).toEqual({
      authorization: 'Bearer test-key',
      'content-type': 'application/json'
    })
  })

  it('401が返ったらunauthorizedとして扱う', async () => {
    const fetchImpl = async (): Promise<Response> => {
      return Response.json({
        error: {
          code: 'unauthorized',
          message: '確認用キーが必要です。'
        }
      }, { status: 401 })
    }

    await expect(searchKnowledgeBase({
      accessKey: 'wrong-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    }, fetchImpl)).rejects.toMatchObject({
      code: 'unauthorized',
      message: '確認用キーが必要です。',
      status: 401
    })
  })

  it('レスポンス形式が不正ならunexpected_responseとして扱う', async () => {
    const fetchImpl = async (): Promise<Response> => {
      return Response.json({ ok: true })
    }

    await expect(searchKnowledgeBase({
      accessKey: 'test-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    }, fetchImpl)).rejects.toMatchObject({
      code: 'unexpected_response',
      message: '検索結果の形式を確認できませんでした。',
      status: 200
    })
  })

  it('fetchが失敗したらnetwork_errorとして扱う', async () => {
    const fetchImpl = async (): Promise<Response> => {
      throw new Error('connection refused')
    }

    await expect(searchKnowledgeBase({
      accessKey: 'test-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    }, fetchImpl)).rejects.toBeInstanceOf(SearchApiError)
    await expect(searchKnowledgeBase({
      accessKey: 'test-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    }, fetchImpl)).rejects.toMatchObject({
      code: 'network_error',
      status: null
    })
  })
})
