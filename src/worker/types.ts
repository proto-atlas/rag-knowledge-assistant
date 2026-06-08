import type { VectorizeIndexBinding, WorkersAiBinding } from '../rag/provider-search'
import type { D1DatabaseLike } from '../rag/d1-source'

export type WorkerBindings = {
  ASSETS?: Fetcher
  RAG_ACCESS_KEY?: string
  RAG_ADMIN_ACCESS_KEY?: string
  RAG_ENABLE_PROVIDER_CHECK?: string
  RAG_SEARCH_PROVIDER_MODE?: string
  RAG_ANSWER_PROVIDER_MODE?: string
  RAG_ENABLE_ANTHROPIC_LIVE?: string
  RAG_ANTHROPIC_API_KEY?: string
  RAG_CLAUDE_MODEL?: string
  RAG_ANTHROPIC_MAX_TOKENS?: string
  RAG_DISABLE_RATE_LIMIT?: string
  RAG_RATE_LIMIT_MAX_REQUESTS?: string
  RAG_RATE_LIMIT_WINDOW_SECONDS?: string
  RAG_DB?: D1DatabaseLike
  AI?: WorkersAiBinding
  RAG_VECTOR_INDEX?: VectorizeIndexBinding
  RAG_ACTIVE_INDEX_VERSION?: string
  RAG_MIN_PROVIDER_VECTOR_SCORE?: string
}

export type ApiErrorCode = 'bad_request' | 'not_found' | 'rate_limited' | 'server_misconfigured' | 'unauthorized'

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
  }
}
