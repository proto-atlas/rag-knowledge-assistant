import { describe, expect, it } from 'vitest'
import { enforceIpRateLimit, getClientIpForRateLimit } from '../../src/worker/rate-limit'
import type { D1BoundValue, D1DatabaseLike } from '../../src/rag/d1-source'

class MemoryRateLimitDb implements D1DatabaseLike {
  private readonly counts = new Map<string, number>()

  prepare(query: string) {
    return {
      bind: (...values: D1BoundValue[]) => ({
        all: async <T = unknown>() => {
          if (query.includes('INSERT INTO request_rate_limits')) {
            const key = createRateLimitKey(values)
            this.counts.set(key, (this.counts.get(key) ?? 0) + 1)

            return { results: [] as T[] }
          }

          if (query.includes('SELECT request_count')) {
            const key = createRateLimitKey(values)
            const requestCount = this.counts.get(key) ?? 0

            return { results: [{ request_count: requestCount } as T] }
          }

          return { results: [] as T[] }
        }
      })
    }
  }
}

describe('enforceIpRateLimit', () => {
  it('disable envがtrueならD1なしでも許可する', async () => {
    const result = await enforceIpRateLimit(new Headers(), {
      RAG_DISABLE_RATE_LIMIT: 'true'
    }, '/api/search')

    expect(result).toEqual({ ok: true })
  })

  it('D1 bindingがない場合はserver_misconfiguredを返す', async () => {
    const result = await enforceIpRateLimit(new Headers(), {}, '/api/search')

    expect(result).toEqual({
      ok: false,
      status: 500,
      response: {
        error: {
          code: 'server_misconfigured',
          message: 'rate limitの実行設定が不足しています。'
        }
      }
    })
  })

  it('同一IPと同一routeで上限を超えたら429を返す', async () => {
    const headers = new Headers({ 'cf-connecting-ip': '203.0.113.10' })
    const env = {
      RAG_DB: new MemoryRateLimitDb(),
      RAG_RATE_LIMIT_MAX_REQUESTS: '2',
      RAG_RATE_LIMIT_WINDOW_SECONDS: '60'
    }

    expect(await enforceIpRateLimit(headers, env, '/api/search')).toEqual({ ok: true })
    expect(await enforceIpRateLimit(headers, env, '/api/search')).toEqual({ ok: true })
    const result = await enforceIpRateLimit(headers, env, '/api/search')

    expect(result).toEqual({
      ok: false,
      status: 429,
      response: {
        error: {
          code: 'rate_limited',
          message: '短時間のリクエスト数が上限を超えました。しばらく待ってから再試行してください。'
        }
      }
    })
  })

  it('routeが違う場合は別windowとして扱う', async () => {
    const headers = new Headers({ 'cf-connecting-ip': '203.0.113.10' })
    const env = {
      RAG_DB: new MemoryRateLimitDb(),
      RAG_RATE_LIMIT_MAX_REQUESTS: '1',
      RAG_RATE_LIMIT_WINDOW_SECONDS: '60'
    }

    expect(await enforceIpRateLimit(headers, env, '/api/search')).toEqual({ ok: true })
    expect(await enforceIpRateLimit(headers, env, '/api/ask')).toEqual({ ok: true })
  })

  it('正の整数ではないmax request envならserver_misconfiguredを返す', async () => {
    const result = await enforceIpRateLimit(new Headers(), {
      RAG_DB: new MemoryRateLimitDb(),
      RAG_RATE_LIMIT_MAX_REQUESTS: '0'
    }, '/api/search')

    expect(result).toEqual({
      ok: false,
      status: 500,
      response: {
        error: {
          code: 'server_misconfigured',
          message: 'RAG_RATE_LIMIT_MAX_REQUESTS must be a positive integer'
        }
      }
    })
  })
})

describe('getClientIpForRateLimit', () => {
  it('CF-Connecting-IPをtrimして返す', () => {
    const headers = new Headers({ 'cf-connecting-ip': ' 203.0.113.10 ' })

    expect(getClientIpForRateLimit(headers)).toBe('203.0.113.10')
  })

  it('CF-Connecting-IPがない場合はunknown-clientを返す', () => {
    expect(getClientIpForRateLimit(new Headers())).toBe('unknown-client')
  })
})

function createRateLimitKey(values: D1BoundValue[]): string {
  return `${String(values[0])}:${String(values[1])}:${String(values[2])}`
}
