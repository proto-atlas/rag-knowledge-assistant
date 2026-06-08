import { normalizeAnthropicStreamEvent } from './anthropic-stream-adapter'
import {
  extractCitedSourceIds,
  findInvalidSourceIds
} from './rag-stream'
import type { SearchResponse } from '../rag/search-types'
import type { RagStreamEvent, RagStreamEventSource } from './rag-stream'

export const ANTHROPIC_MESSAGES_ENDPOINT = 'https://api.anthropic.com/v1/messages'
export const ANTHROPIC_VERSION = '2023-06-01'
// live checkのコストを抑える確認環境向け初期値。production用途ではroute/model単位で設定化する。
export const DEFAULT_ANTHROPIC_MAX_TOKENS = 512

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type AnthropicAnswerProviderConfig = {
  apiKey: string
  model: string
  fetchImpl?: FetchLike
  maxTokens?: number
  endpoint?: string
  signal?: AbortSignal
}

type AnthropicMessageRequestBody = {
  model: string
  max_tokens: number
  stream: true
  system: string
  messages: Array<{
    role: 'user'
    content: string
  }>
}

export async function runAnthropicAnswerProvider(
  searchResponse: SearchResponse,
  config: AnthropicAnswerProviderConfig
): Promise<RagStreamEventSource> {
  if (searchResponse.noAnswerRecommended || searchResponse.results.length === 0) {
    return createNoAnswerEvents(searchResponse)
  }

  const fetchImpl = config.fetchImpl ?? fetch
  const response = await fetchImpl(config.endpoint ?? ANTHROPIC_MESSAGES_ENDPOINT, {
    method: 'POST',
    headers: {
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(createAnthropicMessageRequestBody(searchResponse, config)),
    signal: config.signal
  })

  if (!response.ok || !response.body) {
    return createProviderErrorEvents(searchResponse, response.status)
  }

  return createValidatedAnthropicEventStream(searchResponse, response.body)
}

export function createAnthropicMessageRequestBody(
  searchResponse: SearchResponse,
  config: Pick<AnthropicAnswerProviderConfig, 'model' | 'maxTokens'>
): AnthropicMessageRequestBody {
  const sourceContext = searchResponse.results.map((result) => {
    const heading = result.headingPath.join(' / ')
    return `[${result.sourceId}] ${result.documentTitle} / ${heading}\n${result.excerpt}`
  }).join('\n\n')

  return {
    model: config.model,
    max_tokens: config.maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    stream: true,
    system: [
      'あなたは公開URL用のRAG回答アシスタントです。',
      '回答は渡されたsourcesだけに基づけてください。',
      '一般知識で補足しないでください。',
      '根拠が足りない場合は、回答できないと述べてください。',
      '回答では根拠source idを [1] の形式で明示してください。'
    ].join('\n'),
    messages: [
      {
        role: 'user',
        content: [
          `質問: ${searchResponse.query}`,
          '',
          'Sources:',
          sourceContext
        ].join('\n')
      }
    ]
  }
}

export async function collectAnthropicStreamEvents(stream: ReadableStream<Uint8Array>): Promise<RagStreamEvent[]> {
  const events: RagStreamEvent[] = []

  for await (const payload of readAnthropicSsePayloads(stream)) {
    const normalized = normalizeAnthropicStreamEvent(payload)

    if (normalized.type === 'event') {
      events.push(normalized.event)
    }
  }

  return events
}

export async function* readAnthropicSsePayloads(stream: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
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
    const parsed = parseAnthropicSseFrames(buffer)
    buffer = parsed.remaining

    for (const payload of parsed.payloads) {
      yield payload
    }
  }

  const trailingFrame = buffer.trim()

  if (trailingFrame.length > 0) {
    yield parseAnthropicSseFrame(trailingFrame)
  }
}

async function* createValidatedAnthropicEventStream(
  searchResponse: SearchResponse,
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<RagStreamEvent> {
  yield* createRetrievalEvents(searchResponse)
  yield {
    type: 'generation_start'
  }

  let text = ''

  for await (const payload of readAnthropicSsePayloads(stream)) {
    const normalized = normalizeAnthropicStreamEvent(payload)

    if (normalized.type !== 'event') {
      continue
    }

    if (normalized.event.type === 'answer_delta') {
      text += normalized.event.text
      yield normalized.event
      continue
    }

    if (normalized.event.type === 'error') {
      yield normalized.event
      yield {
        type: 'done'
      }
      return
    }
  }

  const citedSourceIds = extractCitedSourceIds(text)
  const invalidSourceIds = citedSourceIds.length === 0
    ? ['missing']
    : findInvalidSourceIds(citedSourceIds, searchResponse)

  if (invalidSourceIds.length > 0) {
    yield {
      type: 'source_validation_failed',
      message: '回答の根拠を確認できなかったため表示できません。',
      invalidSourceIds
    }
  }

  yield {
    type: 'done'
  }
}

function* createNoAnswerEvents(searchResponse: SearchResponse): Generator<RagStreamEvent> {
  yield* createRetrievalEvents(searchResponse)
  yield {
    type: 'no_answer',
    message: '根拠候補が弱いため回答できません。'
  }
  yield {
    type: 'done'
  }
}

function* createProviderErrorEvents(searchResponse: SearchResponse, status: number): Generator<RagStreamEvent> {
  yield* createRetrievalEvents(searchResponse)
  yield {
    type: 'generation_start'
  }
  yield {
    type: 'error',
    code: status === 529 ? 'overloaded' : 'provider_error',
    message: '回答providerで一時的な問題が発生しました。'
  }
  yield {
    type: 'done'
  }
}

function createRetrievalEvents(searchResponse: SearchResponse): RagStreamEvent[] {
  return [
    {
      type: 'retrieval_start',
      query: searchResponse.query
    },
    {
      type: 'sources',
      response: searchResponse
    }
  ]
}

function parseAnthropicSseFrames(buffer: string): { payloads: unknown[]; remaining: string } {
  const payloads: unknown[] = []
  let remaining = buffer
  let separatorIndex = remaining.indexOf('\n\n')

  while (separatorIndex >= 0) {
    const frame = remaining.slice(0, separatorIndex).trim()
    remaining = remaining.slice(separatorIndex + 2)

    if (frame.length > 0) {
      payloads.push(parseAnthropicSseFrame(frame))
    }

    separatorIndex = remaining.indexOf('\n\n')
  }

  return { payloads, remaining }
}

function parseAnthropicSseFrame(frame: string): unknown {
  const dataLines: string[] = []

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  if (dataLines.length === 0) {
    return {}
  }

  try {
    return JSON.parse(dataLines.join('\n')) as unknown
  } catch {
    return {
      type: 'error',
      error: {
        type: 'invalid_stream_json'
      }
    }
  }
}
