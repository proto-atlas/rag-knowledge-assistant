import type { ApiErrorResponse, WorkerBindings } from './types'

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 429 | 500; response: ApiErrorResponse }

// 外部APIの呼び出し回数を抑えるための既定値。ユーザー認証や契約上限の代替ではない。
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 60
export const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60

const encoder = new TextEncoder()

type RateLimitRow = {
  request_count: number
}

export async function enforceIpRateLimit(headers: Headers, env: WorkerBindings, route: string): Promise<RateLimitResult> {
  if (env.RAG_DISABLE_RATE_LIMIT === 'true') {
    return { ok: true }
  }

  if (!env.RAG_DB) {
    return {
      ok: false,
      status: 500,
      response: {
        error: {
          code: 'server_misconfigured',
          message: 'rate limitの実行設定が不足しています。'
        }
      }
    }
  }

  const policy = parseRateLimitPolicy(env)

  if (!policy.ok) {
    return policy
  }

  const now = Date.now()
  const windowMs = policy.windowSeconds * 1000
  const windowStart = Math.floor(now / windowMs) * windowMs
  const clientKeyHash = await hashClientKey(`${route}:${getClientIpForRateLimit(headers)}`)
  const updatedAt = new Date(now).toISOString()

  await env.RAG_DB.prepare(`
    INSERT INTO request_rate_limits (client_key_hash, route, window_start, request_count, updated_at)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(client_key_hash, route, window_start)
    DO UPDATE SET
      request_count = request_count + 1,
      updated_at = excluded.updated_at
  `).bind(clientKeyHash, route, windowStart, updatedAt).all()

  const result = await env.RAG_DB.prepare(`
    SELECT request_count
    FROM request_rate_limits
    WHERE client_key_hash = ?
      AND route = ?
      AND window_start = ?
    LIMIT 1
  `).bind(clientKeyHash, route, windowStart).all<RateLimitRow>()
  const requestCount = result.results?.[0]?.request_count ?? 0

  if (requestCount > policy.maxRequests) {
    return {
      ok: false,
      status: 429,
      response: {
        error: {
          code: 'rate_limited',
          message: '短時間のリクエスト数が上限を超えました。しばらく待ってから再試行してください。'
        }
      }
    }
  }

  return { ok: true }
}

export function getClientIpForRateLimit(headers: Headers): string {
  return headers.get('cf-connecting-ip')?.trim() || 'unknown-client'
}

function parseRateLimitPolicy(env: WorkerBindings): { ok: true; maxRequests: number; windowSeconds: number } | Extract<RateLimitResult, { ok: false }> {
  const maxRequests = parsePositiveInteger(
    env.RAG_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    'RAG_RATE_LIMIT_MAX_REQUESTS must be a positive integer'
  )
  const windowSeconds = parsePositiveInteger(
    env.RAG_RATE_LIMIT_WINDOW_SECONDS,
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    'RAG_RATE_LIMIT_WINDOW_SECONDS must be a positive integer'
  )

  if (!maxRequests.ok) {
    return createServerMisconfiguredResult(maxRequests.message)
  }

  if (!windowSeconds.ok) {
    return createServerMisconfiguredResult(windowSeconds.message)
  }

  return {
    ok: true,
    maxRequests: maxRequests.value,
    windowSeconds: windowSeconds.value
  }
}

function parsePositiveInteger(raw: string | undefined, fallback: number, message: string): { ok: true; value: number } | { ok: false; message: string } {
  if (raw === undefined || raw.trim().length === 0) {
    return { ok: true, value: fallback }
  }

  const parsed = Number(raw)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false, message }
  }

  return { ok: true, value: parsed }
}

function createServerMisconfiguredResult(message: string): Extract<RateLimitResult, { ok: false }> {
  return {
    ok: false,
    status: 500,
    response: {
      error: {
        code: 'server_misconfigured',
        message
      }
    }
  }
}

async function hashClientKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
