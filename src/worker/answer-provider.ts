import { createMockRagStreamEvents } from './rag-stream'
import { runAnthropicAnswerProvider, type FetchLike } from './anthropic-answer-provider'
import type { SearchResponse } from '../rag/search-types'
import type { RagStreamEventSource } from './rag-stream'
import type { WorkerBindings } from './types'

export const MOCK_ANSWER_PROVIDER_MODE = 'mock'
export const ANTHROPIC_ANSWER_PROVIDER_MODE = 'anthropic'
const MIN_ANTHROPIC_MAX_TOKENS = 64
const MAX_ANTHROPIC_MAX_TOKENS = 2048

export type AnswerProviderOptions = {
  fetchImpl?: FetchLike
  signal?: AbortSignal
}

export async function createAnswerProviderEvents(
  searchResponse: SearchResponse,
  env: WorkerBindings,
  options: AnswerProviderOptions = {}
): Promise<RagStreamEventSource> {
  const mode = normalizeAnswerProviderMode(env.RAG_ANSWER_PROVIDER_MODE)

  if (mode === MOCK_ANSWER_PROVIDER_MODE) {
    return createMockRagStreamEvents(searchResponse)
  }

  if (env.RAG_ENABLE_ANTHROPIC_LIVE !== 'true' || !env.RAG_ANTHROPIC_API_KEY || !env.RAG_CLAUDE_MODEL) {
    throw new Error('anthropic answer provider bindings are missing')
  }

  return runAnthropicAnswerProvider(searchResponse, {
    apiKey: env.RAG_ANTHROPIC_API_KEY,
    model: env.RAG_CLAUDE_MODEL,
    fetchImpl: options.fetchImpl,
    maxTokens: parseAnthropicMaxTokens(env.RAG_ANTHROPIC_MAX_TOKENS),
    signal: options.signal
  })
}

export function parseAnthropicMaxTokens(value: string | undefined): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < MIN_ANTHROPIC_MAX_TOKENS || parsed > MAX_ANTHROPIC_MAX_TOKENS) {
    throw new Error('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  }

  return parsed
}

export function normalizeAnswerProviderMode(value: string | undefined): typeof MOCK_ANSWER_PROVIDER_MODE | typeof ANTHROPIC_ANSWER_PROVIDER_MODE {
  if (value === undefined || value.trim().length === 0) {
    return MOCK_ANSWER_PROVIDER_MODE
  }

  if (value === MOCK_ANSWER_PROVIDER_MODE || value === ANTHROPIC_ANSWER_PROVIDER_MODE) {
    return value
  }

  throw new Error('RAG_ANSWER_PROVIDER_MODE is invalid')
}
