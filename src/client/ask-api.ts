import { fixtureCategories, type FixtureCategory } from '../shared/fixture-documents'
import type { SearchResponse, SearchResult } from '../rag/search-types'

export type AskApiErrorCode =
  | 'bad_request'
  | 'network_error'
  | 'server_misconfigured'
  | 'unauthorized'
  | 'unexpected_response'
  | 'unknown_error'

export type AskApiInput = {
  accessKey: string
  question: string
  topK: number
  category?: FixtureCategory
  signal: AbortSignal
}

export type AskStreamEvent =
  | { type: 'retrieval_start'; query: string }
  | { type: 'sources'; response: SearchResponse }
  | { type: 'generation_start' }
  | { type: 'answer_delta'; text: string }
  | { type: 'no_answer'; message: string }
  | { type: 'source_validation_failed'; message: string; invalidSourceIds: string[] }
  | { type: 'error'; code: 'provider_error' | 'overloaded' | 'unknown_error'; message: string }
  | { type: 'done' }

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type ApiErrorPayload = {
  error: {
    code: string
    message: string
  }
}

export class AskApiError extends Error {
  readonly code: AskApiErrorCode
  readonly status: number | null

  constructor(code: AskApiErrorCode, message: string, status: number | null) {
    super(message)
    this.name = 'AskApiError'
    this.code = code
    this.status = status
  }
}

export async function* streamAskKnowledgeBase(
  input: AskApiInput,
  fetchImpl: FetchLike = fetch
): AsyncGenerator<AskStreamEvent> {
  let response: Response

  try {
    response = await fetchImpl('/api/ask', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${input.accessKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        question: input.question,
        topK: input.topK,
        category: input.category
      }),
      signal: input.signal
    })
  } catch {
    if (input.signal.aborted) {
      throw createAbortError()
    }

    throw new AskApiError('network_error', 'ネットワーク接続を確認してから再試行してください。', null)
  }

  if (!response.ok) {
    const apiError = toApiError(await readJson(response), response.status)
    throw new AskApiError(apiError.code, apiError.message, response.status)
  }

  if (!response.body) {
    throw new AskApiError('unexpected_response', '回答streamを読み取れませんでした。', response.status)
  }

  yield* readSseEvents(response.body)
}

export async function* readSseEvents(stream: ReadableStream<Uint8Array>): AsyncGenerator<AskStreamEvent> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseBufferedSseFrames(buffer)
    buffer = parsed.remaining

    for (const event of parsed.events) {
      yield event
    }
  }

  const trailingFrame = buffer.trim()

  if (trailingFrame.length > 0) {
    yield parseSseFrame(trailingFrame)
  }
}

export function parseSseFrame(frame: string): AskStreamEvent {
  const dataLines: string[] = []
  let eventName: string | null = null

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim()
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  if (!eventName || dataLines.length === 0) {
    throw new AskApiError('unexpected_response', 'SSE eventの形式を確認できませんでした。', 200)
  }

  const payload = parseJson(dataLines.join('\n'))

  if (!isAskStreamEvent(payload) || payload.type !== eventName) {
    throw new AskApiError('unexpected_response', 'SSE eventの内容を確認できませんでした。', 200)
  }

  return payload
}

function parseBufferedSseFrames(buffer: string): { events: AskStreamEvent[]; remaining: string } {
  const events: AskStreamEvent[] = []
  let remaining = buffer
  let separatorIndex = remaining.indexOf('\n\n')

  while (separatorIndex >= 0) {
    const frame = remaining.slice(0, separatorIndex).trim()
    remaining = remaining.slice(separatorIndex + 2)

    if (frame.length > 0) {
      events.push(parseSseFrame(frame))
    }

    separatorIndex = remaining.indexOf('\n\n')
  }

  return { events, remaining }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    throw new AskApiError('unexpected_response', 'SSE dataのJSONを確認できませんでした。', 200)
  }
}

function toApiError(payload: unknown, status: number): { code: AskApiErrorCode; message: string } {
  if (isApiErrorPayload(payload)) {
    return {
      code: toAskApiErrorCode(payload.error.code),
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
      message: 'サーバー設定または回答生成で問題が発生しました。'
    }
  }

  return {
    code: 'unknown_error',
    message: '回答生成に失敗しました。'
  }
}

function toAskApiErrorCode(code: string): AskApiErrorCode {
  if (
    code === 'bad_request'
    || code === 'server_misconfigured'
    || code === 'unauthorized'
  ) {
    return code
  }

  return 'unknown_error'
}

function isAskStreamEvent(value: unknown): value is AskStreamEvent {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  if (value.type === 'retrieval_start') {
    return typeof value.query === 'string'
  }

  if (value.type === 'sources') {
    return isSearchResponse(value.response)
  }

  if (value.type === 'generation_start' || value.type === 'done') {
    return true
  }

  if (value.type === 'answer_delta') {
    return typeof value.text === 'string'
  }

  if (value.type === 'no_answer') {
    return typeof value.message === 'string'
  }

  if (value.type === 'source_validation_failed') {
    return (
      typeof value.message === 'string'
      && Array.isArray(value.invalidSourceIds)
      && value.invalidSourceIds.every((sourceId) => typeof sourceId === 'string')
    )
  }

  if (value.type === 'error') {
    return (
      typeof value.message === 'string'
      && (
        value.code === 'provider_error'
        || value.code === 'overloaded'
        || value.code === 'unknown_error'
      )
    )
  }

  return false
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

function createAbortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}
