import { fixtureCategories, type FixtureCategory } from '../shared/fixture-documents'
import type { SearchResponse, SearchResult } from '../rag/search-types'

export type SearchApiErrorCode =
  | 'bad_request'
  | 'network_error'
  | 'server_misconfigured'
  | 'unauthorized'
  | 'unexpected_response'
  | 'unknown_error'

export type SearchApiInput = {
  accessKey: string
  question: string
  topK: number
  category?: FixtureCategory
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type ApiErrorPayload = {
  error: {
    code: string
    message: string
  }
}

export class SearchApiError extends Error {
  readonly code: SearchApiErrorCode
  readonly status: number | null

  constructor(code: SearchApiErrorCode, message: string, status: number | null) {
    super(message)
    this.name = 'SearchApiError'
    this.code = code
    this.status = status
  }
}

export async function searchKnowledgeBase(input: SearchApiInput, fetchImpl: FetchLike = fetch): Promise<SearchResponse> {
  let response: Response

  try {
    response = await fetchImpl('/api/search', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.accessKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        question: input.question,
        topK: input.topK,
        category: input.category
      })
    })
  } catch {
    throw new SearchApiError('network_error', 'ネットワーク接続を確認してから再試行してください。', null)
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const apiError = toApiError(payload, response.status)
    throw new SearchApiError(apiError.code, apiError.message, response.status)
  }

  if (!isSearchResponse(payload)) {
    throw new SearchApiError('unexpected_response', '検索結果の形式を確認できませんでした。', response.status)
  }

  return payload
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function toApiError(payload: unknown, status: number): { code: SearchApiErrorCode; message: string } {
  if (isApiErrorPayload(payload)) {
    return {
      code: toSearchApiErrorCode(payload.error.code),
      message: payload.error.message
    }
  }

  if (status === 401) {
    return {
      code: 'unauthorized',
      message: 'access keyを確認してください。'
    }
  }

  if (status >= 500) {
    return {
      code: 'server_misconfigured',
      message: 'サーバー設定または検索処理で問題が発生しました。'
    }
  }

  return {
    code: 'unknown_error',
    message: '検索に失敗しました。'
  }
}

function toSearchApiErrorCode(code: string): SearchApiErrorCode {
  if (
    code === 'bad_request'
    || code === 'server_misconfigured'
    || code === 'unauthorized'
  ) {
    return code
  }

  return 'unknown_error'
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false
  }

  return typeof value.error.code === 'string' && typeof value.error.message === 'string'
}

function isSearchResponse(value: unknown): value is SearchResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.query === 'string'
    && typeof value.topK === 'number'
    && typeof value.indexVersion === 'string'
    && typeof value.noAnswerRecommended === 'boolean'
    && Array.isArray(value.results)
    && value.results.every(isSearchResult)
  )
}

function isSearchResult(value: unknown): value is SearchResult {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.sourceId === 'string'
    && typeof value.chunkId === 'string'
    && typeof value.documentSlug === 'string'
    && typeof value.documentTitle === 'string'
    && Array.isArray(value.headingPath)
    && value.headingPath.every((heading) => typeof heading === 'string')
    && typeof value.excerpt === 'string'
    && isFixtureCategory(value.category)
    && Array.isArray(value.tags)
    && value.tags.every((tag) => typeof tag === 'string')
    && typeof value.score === 'number'
  )
}

function isFixtureCategory(value: unknown): value is FixtureCategory {
  return typeof value === 'string' && fixtureCategories.includes(value as FixtureCategory)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
