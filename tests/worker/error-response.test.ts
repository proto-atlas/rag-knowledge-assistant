import { describe, expect, it, vi } from 'vitest'
import { logAndReturn500, normalizeLoggedError, truncateLogMessage } from '../../src/worker/error-response'

describe('truncateLogMessage', () => {
  it('500文字ならそのまま返す', () => {
    const input = 'a'.repeat(500)

    expect(truncateLogMessage(input)).toBe(input)
  })

  it('501文字なら省略記号つきで切り詰める', () => {
    const output = truncateLogMessage('a'.repeat(501))

    expect(output.length).toBe(503)
    expect(output.endsWith('...')).toBe(true)
  })

  it('空文字なら空文字を返す', () => {
    expect(truncateLogMessage('')).toBe('')
  })

  it('非常に長い文字列でも503文字に切り詰める', () => {
    expect(truncateLogMessage('a'.repeat(100000)).length).toBe(503)
  })
})

describe('normalizeLoggedError', () => {
  it('Errorならnameと切り詰めたmessageだけを返す', () => {
    const error = new Error('x'.repeat(600))
    const normalized = normalizeLoggedError(error)

    expect(normalized.name).toBe('Error')
    expect(normalized.message.length).toBe(503)
    expect('stack' in normalized).toBe(false)
  })

  it('文字列throwなら型名とmessageを返す', () => {
    expect(normalizeLoggedError('broken')).toEqual({
      name: 'string',
      message: 'broken'
    })
  })
})

describe('logAndReturn500', () => {
  it('レスポンスにはraw error messageを含めずログには構造化情報を出す', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const jsonMock = vi.fn((body: unknown, status: number) => ({ body, status }))

    try {
      const response = logAndReturn500(
        { json: jsonMock } as unknown as Parameters<typeof logAndReturn500>[0],
        '/api/search',
        new Error('secret-like provider detail'),
        '検索providerの実行設定が不足しています。'
      )

      expect(response).toEqual({
        body: {
          error: {
            code: 'server_misconfigured',
            message: '検索providerの実行設定が不足しています。'
          }
        },
        status: 500
      })
      expect(JSON.stringify(response)).not.toContain('secret-like provider detail')

      const logged = JSON.parse(String(errorSpy.mock.calls[0]?.[0])) as unknown
      expect(logged).toMatchObject({
        level: 'error',
        route: '/api/search',
        code: 'server_misconfigured',
        error: {
          name: 'Error',
          message: 'secret-like provider detail'
        }
      })
      const loggedError = (logged as { error?: Record<string, unknown> }).error
      expect(loggedError).not.toHaveProperty('stack')
      expect(loggedError).not.toHaveProperty('cause')
    } finally {
      errorSpy.mockRestore()
    }
  })
})
