import { getActiveChunksByIds } from '../rag/d1-source'
import type { WorkerBindings } from './types'

const DEFAULT_D1_SMOKE_CHUNK_IDS = [
  'remote-work-policy__s1__c1',
  'security-handbook__s3__c1',
  'release-process__s1__c1'
] as const

type D1SourceSmokeChunk = {
  chunkId: string
  documentSlug: string
  documentTitle: string
  category: string
  headingPath: string[]
  indexVersion: string
  contentLength: number
  contentPreview: string
}

export type D1SourceSmokeResponse = {
  ok: true
  indexVersion: string
  requestedChunkIds: string[]
  foundCount: number
  chunks: D1SourceSmokeChunk[]
}

export async function runD1SourceSmoke(env: WorkerBindings): Promise<D1SourceSmokeResponse> {
  if (!env.RAG_DB || !env.RAG_ACTIVE_INDEX_VERSION) {
    throw new Error('D1 smoke bindings are missing')
  }

  const requestedChunkIds = [...DEFAULT_D1_SMOKE_CHUNK_IDS]
  const chunksById = await getActiveChunksByIds(env.RAG_DB, requestedChunkIds, env.RAG_ACTIVE_INDEX_VERSION)
  const chunks = requestedChunkIds.flatMap((chunkId) => {
    const chunk = chunksById.get(chunkId)

    if (!chunk) {
      return []
    }

    return [{
      chunkId: chunk.chunkId,
      documentSlug: chunk.documentSlug,
      documentTitle: chunk.documentTitle,
      category: chunk.category,
      headingPath: chunk.headingPath,
      indexVersion: chunk.indexVersion,
      contentLength: chunk.content.length,
      contentPreview: createContentPreview(chunk.content)
    }]
  })

  return {
    ok: true,
    indexVersion: env.RAG_ACTIVE_INDEX_VERSION,
    requestedChunkIds,
    foundCount: chunks.length,
    chunks
  }
}

function createContentPreview(content: string): string {
  return content.length <= 80 ? content : `${content.slice(0, 80)}...`
}
