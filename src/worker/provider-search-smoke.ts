import { DEFAULT_VECTORIZE_SMOKE_QUERY } from '../rag/vectorize-smoke'
import { getActiveChunksByIds } from '../rag/d1-source'
import {
  WORKERS_AI_EMBEDDING_MODEL,
  createSearchResponseFromVectorMatches,
  createVectorizeQueryOptions,
  parseFirstWorkersAiEmbeddingVector,
  parseVectorizeMatches
} from '../rag/provider-search'
import type { SearchRequest, SearchResponse } from '../rag/search-types'
import type { WorkerBindings } from './types'
import { extractVectorizeChunkIds } from './search-provider'

export type ProviderSearchSmokeResponse = {
  ok: true
  model: string
  indexVersion: string
  queryText: string
  queryVectorDimensions: number
  vectorMatchCount: number
  d1FoundCount: number
  response: SearchResponse
}

export async function runProviderSearchSmoke(env: WorkerBindings): Promise<ProviderSearchSmokeResponse> {
  if (!env.AI || !env.RAG_VECTOR_INDEX || !env.RAG_DB || !env.RAG_ACTIVE_INDEX_VERSION) {
    throw new Error('provider search smoke bindings are missing')
  }

  const request: SearchRequest = {
    question: DEFAULT_VECTORIZE_SMOKE_QUERY,
    topK: 3,
    category: 'policy'
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
  const response = createSearchResponseFromVectorMatches({
    request,
    activeIndexVersion: env.RAG_ACTIVE_INDEX_VERSION,
    matches,
    chunksById
  })

  return {
    ok: true,
    model: WORKERS_AI_EMBEDDING_MODEL,
    indexVersion: env.RAG_ACTIVE_INDEX_VERSION,
    queryText: request.question,
    queryVectorDimensions: queryVector.length,
    vectorMatchCount: matches.length,
    d1FoundCount: chunksById.size,
    response
  }
}
