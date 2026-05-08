import { DEFAULT_VECTORIZE_SMOKE_QUERY } from '../rag/vectorize-smoke'
import {
  WORKERS_AI_EMBEDDING_MODEL,
  createVectorizeQueryOptions,
  parseFirstWorkersAiEmbeddingVector,
  parseVectorizeMatches
} from '../rag/provider-search'
import type { SearchRequest } from '../rag/search-types'
import type { WorkerBindings } from './types'

export type ProviderVectorizeSmokeMatch = {
  id: string
  score: number
  metadata?: {
    chunkId?: string
    documentSlug?: string
    category?: string
    indexVersion?: string
    smokeRunId?: string
  }
}

export type ProviderVectorizeSmokeResponse = {
  ok: true
  model: string
  indexVersion: string
  queryText: string
  queryVectorDimensions: number
  filter: {
    indexVersion: string
    category: 'policy'
  }
  count: number
  matches: ProviderVectorizeSmokeMatch[]
}

export async function runProviderVectorizeSmoke(env: WorkerBindings): Promise<ProviderVectorizeSmokeResponse> {
  if (!env.AI || !env.RAG_VECTOR_INDEX || !env.RAG_ACTIVE_INDEX_VERSION) {
    throw new Error('provider smoke bindings are missing')
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

  return {
    ok: true,
    model: WORKERS_AI_EMBEDDING_MODEL,
    indexVersion: env.RAG_ACTIVE_INDEX_VERSION,
    queryText: request.question,
    queryVectorDimensions: queryVector.length,
    filter: {
      indexVersion: env.RAG_ACTIVE_INDEX_VERSION,
      category: 'policy'
    },
    count: matches.length,
    matches: matches.map((match) => ({
      id: match.id,
      score: match.score,
      metadata: {
        chunkId: match.metadata?.chunkId,
        documentSlug: match.metadata?.documentSlug,
        category: match.metadata?.category,
        indexVersion: match.metadata?.indexVersion,
        smokeRunId: readSmokeRunId(match.metadata)
      }
    }))
  }
}

function readSmokeRunId(metadata: unknown): string | undefined {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return undefined
  }

  const value = (metadata as Record<string, unknown>).smokeRunId
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
