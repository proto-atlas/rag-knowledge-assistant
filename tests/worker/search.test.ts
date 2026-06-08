import { describe, expect, it, vi } from 'vitest'
import { app } from '../../src/worker/app'

const env = {
  RAG_ACCESS_KEY: 'test-access-key',
  RAG_DISABLE_RATE_LIMIT: 'true'
}

describe('POST /api/search', () => {
  it('確認用キーなしで呼ぶと401を返す', async () => {
    const response = await app.request('/api/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'リモート勤務の申請期限は？' })
    }, env)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      error: {
        code: 'unauthorized',
        message: '確認用キーが必要です。'
      }
    })
  })

  it('確認用キーが正しいと検索結果を返す', async () => {
    const response = await app.request('/api/search', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-access-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ question: 'リモート勤務の申請期限は？' })
    }, env)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      query: 'リモート勤務の申請期限は？',
      topK: 5,
      indexVersion: 'fixture-corpus-v1',
      noAnswerRecommended: false
    })
    expect(JSON.stringify(body)).not.toContain('test-access-key')
  })

  it('JSON bodyが不正なら400を返す', async () => {
    const response = await app.request('/api/search', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-access-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ topK: 5 })
    }, env)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: {
        code: 'bad_request',
        message: 'questionは文字列で指定してください。'
      }
    })
  })

  it('envに確認用キーがない場合は500を返す', async () => {
    const response = await app.request('/api/search', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-access-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ question: 'リモート勤務の申請期限は？' })
    })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: 'server_misconfigured',
        message: 'サーバー設定が不足しています。'
      }
    })
  })

  it('provider modeでbindingが不足していたら500を返し内部情報を出さない', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      const response = await app.request('/api/search', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-access-key',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ question: 'リモート勤務の申請期限は？' })
      }, {
        ...env,
        RAG_SEARCH_PROVIDER_MODE: 'vectorize-d1'
      })
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body).toEqual({
        error: {
          code: 'server_misconfigured',
          message: '検索providerの実行設定が不足しています。'
        }
      })
      expect(JSON.stringify(body)).not.toContain('test-access-key')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"route":"/api/search"'))
    } finally {
      errorSpy.mockRestore()
    }
  })
})
