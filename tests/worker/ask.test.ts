import { describe, expect, it } from 'vitest'
import { app } from '../../src/worker/app'

const env = {
  RAG_ACCESS_KEY: 'test-access-key',
  RAG_DISABLE_RATE_LIMIT: 'true'
}

describe('POST /api/ask', () => {
  it('確認用キーなしで呼ぶと401を返す', async () => {
    const response = await app.request('/api/ask', {
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

  it('確認用キーが正しいとSSEでmock回答を返す', async () => {
    const response = await app.request('/api/ask', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-access-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ question: 'リモート勤務の申請期限は？' })
    }, env)
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(text).toContain('event: retrieval_start')
    expect(text).toContain('event: sources')
    expect(text).toContain('event: generation_start')
    expect(text).toContain('event: answer_delta')
    expect(text).toContain('event: done')
    expect(text).not.toContain('test-access-key')
  })

  it('根拠候補が弱い質問ではno_answerを返す', async () => {
    const response = await app.request('/api/ask', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-access-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ question: '天気予報を教えて' })
    }, env)
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toContain('event: no_answer')
    expect(text).not.toContain('event: answer_delta')
  })

  it('provider modeでbindingが不足していたら500を返し内部情報を出さない', async () => {
    const response = await app.request('/api/ask', {
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
        message: '回答providerの実行設定が不足しています。'
      }
    })
    expect(JSON.stringify(body)).not.toContain('test-access-key')
  })

  it('anthropic answer provider modeは未実装のため500を返し内部情報を出さない', async () => {
    const response = await app.request('/api/ask', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-access-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ question: 'リモート勤務の申請期限は？' })
    }, {
      ...env,
      RAG_ANSWER_PROVIDER_MODE: 'anthropic'
    })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: 'server_misconfigured',
        message: '回答providerの実行設定が不足しています。'
      }
    })
    expect(JSON.stringify(body)).not.toContain('anthropic answer provider is not implemented')
    expect(JSON.stringify(body)).not.toContain('test-access-key')
  })
})
