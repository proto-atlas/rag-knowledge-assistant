import { fixtureCategories } from '../shared/fixture-documents'
import { createSearchRequest } from '../rag/mock-search'
import type { ApiErrorResponse } from './types'

export type SearchRequestParseResult =
  | { ok: true; value: ReturnType<typeof createSearchRequest> }
  | { ok: false; response: ApiErrorResponse }

export function parseSearchRequestBody(body: unknown): SearchRequestParseResult {
  if (!isRecord(body)) {
    return createBadRequest('JSON bodyが必要です。')
  }

  const { question, topK, category } = body

  if (typeof question !== 'string') {
    return createBadRequest('questionは文字列で指定してください。')
  }

  if (topK !== undefined && typeof topK !== 'number') {
    return createBadRequest('topKは数値で指定してください。')
  }

  if (category !== undefined && !isFixtureCategory(category)) {
    return createBadRequest('categoryが不正です。')
  }

  try {
    return {
      ok: true,
      value: createSearchRequest({
        question,
        topK,
        category
      })
    }
  } catch {
    return createBadRequest('検索条件が不正です。')
  }
}

function createBadRequest(message: string): SearchRequestParseResult {
  return {
    ok: false,
    response: {
      error: {
        code: 'bad_request',
        message
      }
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFixtureCategory(value: unknown): value is (typeof fixtureCategories)[number] {
  return typeof value === 'string' && fixtureCategories.includes(value as (typeof fixtureCategories)[number])
}
