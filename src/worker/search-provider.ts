import { getActiveChunksByIds } from '../rag/d1-source'
import { searchMockCorpus } from '../rag/mock-search'
import {
  WORKERS_AI_EMBEDDING_MODEL,
  createSearchResponseFromVectorMatches,
  createVectorizeQueryOptions,
  parseFirstWorkersAiEmbeddingVector,
  parseVectorizeMatches
} from '../rag/provider-search'
import type { SearchRequest, SearchResponse } from '../rag/search-types'
import type { VectorizeMatch } from '../rag/provider-search'
import type { WorkerBindings } from './types'

export const VECTORIZE_D1_SEARCH_PROVIDER_MODE = 'vectorize-d1'

export async function runSearchProvider(
  request: SearchRequest,
  env: WorkerBindings
): Promise<SearchResponse> {
  if (env.RAG_SEARCH_PROVIDER_MODE !== VECTORIZE_D1_SEARCH_PROVIDER_MODE) {
    return searchMockCorpus(request)
  }

  return runVectorizeD1SearchProvider(request, env)
}

async function runVectorizeD1SearchProvider(
  request: SearchRequest,
  env: WorkerBindings
): Promise<SearchResponse> {
  if (!env.AI || !env.RAG_VECTOR_INDEX || !env.RAG_DB || !env.RAG_ACTIVE_INDEX_VERSION) {
    throw new Error('vectorize d1 search provider bindings are missing')
  }

  const embeddingResponse = await env.AI.run(WORKERS_AI_EMBEDDING_MODEL, {
    text: [request.question],
    truncate_inputs: false
  })
  const queryVector = parseFirstWorkersAiEmbeddingVector(embeddingResponse)
  const queryOptions = createVectorizeQueryOptions(request, env.RAG_ACTIVE_INDEX_VERSION)
  const vectorizeResponse = await env.RAG_VECTOR_INDEX.query(queryVector, queryOptions)
  const matches = parseVectorizeMatches(vectorizeResponse)
  const chunkIds = extractVectorizeChunkIds(matches)
  const chunksById = await getActiveChunksByIds(env.RAG_DB, chunkIds, env.RAG_ACTIVE_INDEX_VERSION)

  return createSearchResponseFromVectorMatches({
    request,
    activeIndexVersion: env.RAG_ACTIVE_INDEX_VERSION,
    matches,
    chunksById,
    minScore: parseProviderMinScore(env.RAG_MIN_PROVIDER_VECTOR_SCORE)
  })
}

export function parseProviderMinScore(value: string | undefined): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined
  }

  const parsed = Number(value)

  // この公開URLの現在の閾値方針として0..1に閉じる。Vectorize一般のscore不変条件ではない。
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error('RAG_MIN_PROVIDER_VECTOR_SCORE is invalid')
  }

  return parsed
}

export function extractVectorizeChunkIds(matches: VectorizeMatch[]): string[] {
  const chunkIds = new Set<string>()

  for (const match of matches) {
    chunkIds.add(match.metadata?.chunkId ?? match.id)
  }

  return [...chunkIds]
}
