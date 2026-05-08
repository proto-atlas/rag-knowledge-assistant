import { Hono } from 'hono'
import { initialPublicStatus } from '../shared/public-status'
import { runProviderVectorizeSmoke } from './provider-smoke'
import { runD1SourceSmoke } from './d1-smoke'
import { runProviderSearchSmoke } from './provider-search-smoke'
import { runSearchProvider } from './search-provider'
import { parseSearchRequestBody } from './search-request'
import { createSseResponse } from './rag-stream'
import { createAnswerProviderEvents } from './answer-provider'
import { verifyAccessKey, verifyAdminAccessKey } from './auth'
import { logAndReturn500 } from './error-response'
import { enforceIpRateLimit } from './rate-limit'
import type { ApiErrorResponse, WorkerBindings } from './types'

export const app = new Hono<{ Bindings: WorkerBindings }>()

app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'rag-knowledge-assistant'
  })
})

app.get('/api/public/status', (c) => {
  return c.json(initialPublicStatus)
})

app.post('/api/search', async (c) => {
  const accessKeyResult = await verifyAccessKey(c.req.raw.headers, c.env)

  if (!accessKeyResult.ok) {
    return c.json(accessKeyResult.response, accessKeyResult.status)
  }

  const rateLimitResult = await enforceIpRateLimit(c.req.raw.headers, c.env, '/api/search')

  if (!rateLimitResult.ok) {
    return c.json(rateLimitResult.response, rateLimitResult.status)
  }

  const body = await c.req.json().catch(() => null)
  const request = parseSearchRequestBody(body)

  if (!request.ok) {
    return c.json(request.response, 400)
  }

  try {
    return c.json(await runSearchProvider(request.value, c.env))
  } catch (error) {
    return logAndReturn500(c, '/api/search', error, '検索providerの実行設定が不足しています。')
  }
})

app.post('/api/ask', async (c) => {
  const accessKeyResult = await verifyAccessKey(c.req.raw.headers, c.env)

  if (!accessKeyResult.ok) {
    return c.json(accessKeyResult.response, accessKeyResult.status)
  }

  const rateLimitResult = await enforceIpRateLimit(c.req.raw.headers, c.env, '/api/ask')

  if (!rateLimitResult.ok) {
    return c.json(rateLimitResult.response, rateLimitResult.status)
  }

  const body = await c.req.json().catch(() => null)
  const request = parseSearchRequestBody(body)

  if (!request.ok) {
    return c.json(request.response, 400)
  }

  try {
    const searchResponse = await runSearchProvider(request.value, c.env)
    const events = await createAnswerProviderEvents(searchResponse, c.env, {
      signal: c.req.raw.signal
    })
    return createSseResponse(events, c.req.raw.signal)
  } catch (error) {
    return logAndReturn500(c, '/api/ask', error, '回答providerの実行設定が不足しています。')
  }
})

app.post('/api/internal/vectorize-smoke', async (c) => {
  if (c.env.RAG_ENABLE_PROVIDER_SMOKE !== 'true') {
    return c.json(createNotFoundResponse(), 404)
  }

  const adminAccessKeyResult = await verifyAdminAccessKey(c.req.raw.headers, c.env)

  if (!adminAccessKeyResult.ok) {
    return c.json(adminAccessKeyResult.response, adminAccessKeyResult.status)
  }

  try {
    return c.json(await runProviderVectorizeSmoke(c.env))
  } catch (error) {
    return logAndReturn500(c, '/api/internal/vectorize-smoke', error, 'provider smokeの実行設定が不足しています。')
  }
})

app.post('/api/internal/d1-smoke', async (c) => {
  if (c.env.RAG_ENABLE_PROVIDER_SMOKE !== 'true') {
    return c.json(createNotFoundResponse(), 404)
  }

  const adminAccessKeyResult = await verifyAdminAccessKey(c.req.raw.headers, c.env)

  if (!adminAccessKeyResult.ok) {
    return c.json(adminAccessKeyResult.response, adminAccessKeyResult.status)
  }

  try {
    return c.json(await runD1SourceSmoke(c.env))
  } catch (error) {
    return logAndReturn500(c, '/api/internal/d1-smoke', error, 'D1 smokeの実行設定が不足しています。')
  }
})

app.post('/api/internal/provider-search-smoke', async (c) => {
  if (c.env.RAG_ENABLE_PROVIDER_SMOKE !== 'true') {
    return c.json(createNotFoundResponse(), 404)
  }

  const adminAccessKeyResult = await verifyAdminAccessKey(c.req.raw.headers, c.env)

  if (!adminAccessKeyResult.ok) {
    return c.json(adminAccessKeyResult.response, adminAccessKeyResult.status)
  }

  try {
    return c.json(await runProviderSearchSmoke(c.env))
  } catch (error) {
    return logAndReturn500(c, '/api/internal/provider-search-smoke', error, 'provider search smokeの実行設定が不足しています。')
  }
})

app.notFound((c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw)
  }

  return c.json(createNotFoundResponse(), 404)
})

function createNotFoundResponse(): ApiErrorResponse {
  return {
    error: {
      code: 'not_found',
      message: '指定されたリソースは見つかりません。'
    }
  }
}
