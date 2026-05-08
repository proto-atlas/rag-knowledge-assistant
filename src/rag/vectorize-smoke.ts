import type { SearchCorpusChunk } from './search-types'
import { PROVIDER_INDEX_VERSION } from './provider-search'

export const VECTORIZE_SMOKE_CHUNK_IDS = [
  'remote-work-policy__s1__c1',
  'security-handbook__s3__c1',
  'release-process__s1__c1'
] as const

export const DEFAULT_VECTORIZE_SMOKE_QUERY = 'リモート勤務の申請期限は？'

export type WorkersAiEmbeddingBatchRequest = {
  text: string[]
  truncate_inputs: boolean
}

export type VectorizeSmokeMetadata = {
  chunkId: string
  documentSlug: string
  documentTitle: string
  category: string
  indexVersion: string
  headingPath: string[]
  tags: string[]
  smokeRunId: string
}

export type VectorizeSmokeRecord = {
  id: string
  values: number[]
  metadata: VectorizeSmokeMetadata
}

export type VectorizeSmokeSummary = {
  smokeRunId: string
  indexVersion: string
  chunkIds: string[]
  vectorCount: number
  queryText: string
  queryVectorDimensions: number
}

export function selectVectorizeSmokeChunks(corpus: readonly SearchCorpusChunk[]): SearchCorpusChunk[] {
  return VECTORIZE_SMOKE_CHUNK_IDS.map((chunkId) => {
    const chunk = corpus.find((candidate) => candidate.chunkId === chunkId)

    if (!chunk) {
      throw new Error(`smoke chunk not found: ${chunkId}`)
    }

    return {
      ...chunk,
      indexVersion: PROVIDER_INDEX_VERSION
    }
  })
}

export function createWorkersAiEmbeddingBatchRequest(input: {
  chunks: readonly SearchCorpusChunk[]
  queryText: string
}): WorkersAiEmbeddingBatchRequest {
  const queryText = input.queryText.trim()

  if (input.chunks.length === 0) {
    throw new Error('smoke chunks are required')
  }

  if (queryText.length === 0) {
    throw new Error('query text is required')
  }

  return {
    text: [...input.chunks.map((chunk) => chunk.content), queryText],
    truncate_inputs: false
  }
}

export function parseWorkersAiEmbeddingVectors(response: unknown): number[][] {
  const unwrappedResponse = unwrapWorkersAiRestResponse(response)
  const record = assertRecord(unwrappedResponse, 'Workers AI embedding response must be an object')
  const candidate = Array.isArray(record.data) ? record.data : record.response

  if (!Array.isArray(candidate)) {
    throw new Error('Workers AI embedding response does not contain embedding vectors')
  }

  if (candidate.length === 0) {
    throw new Error('Workers AI embedding response contains no vectors')
  }

  return candidate.map((vector) => parseNumberVector(vector))
}

export function createVectorizeSmokeRecords(input: {
  chunks: readonly SearchCorpusChunk[]
  vectors: readonly number[][]
  smokeRunId: string
}): VectorizeSmokeRecord[] {
  const smokeRunId = input.smokeRunId.trim()

  if (smokeRunId.length === 0) {
    throw new Error('smokeRunId is required')
  }

  if (input.chunks.length !== input.vectors.length) {
    throw new Error('smoke chunk and vector counts must match')
  }

  return input.chunks.map((chunk, index) => ({
    id: chunk.chunkId,
    values: parseNumberVector(input.vectors[index]),
    metadata: {
      chunkId: chunk.chunkId,
      documentSlug: chunk.documentSlug,
      documentTitle: chunk.documentTitle,
      category: chunk.category,
      indexVersion: chunk.indexVersion,
      headingPath: chunk.headingPath,
      tags: chunk.tags,
      smokeRunId
    }
  }))
}

export function serializeVectorizeSmokeNdjson(records: readonly VectorizeSmokeRecord[]): string {
  if (records.length === 0) {
    throw new Error('smoke records are required')
  }

  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`
}

export function createVectorizeSmokeSummary(input: {
  records: readonly VectorizeSmokeRecord[]
  queryText: string
  queryVector: readonly number[]
  smokeRunId: string
}): VectorizeSmokeSummary {
  const queryText = input.queryText.trim()
  const queryVector = parseNumberVector(input.queryVector)

  if (queryText.length === 0) {
    throw new Error('query text is required')
  }

  if (input.records.length === 0) {
    throw new Error('smoke records are required')
  }

  return {
    smokeRunId: input.smokeRunId,
    indexVersion: input.records[0]?.metadata.indexVersion ?? PROVIDER_INDEX_VERSION,
    chunkIds: input.records.map((record) => record.id),
    vectorCount: input.records.length,
    queryText,
    queryVectorDimensions: queryVector.length
  }
}

function unwrapWorkersAiRestResponse(response: unknown): unknown {
  if (!isRecord(response)) {
    return response
  }

  if (response.result !== undefined) {
    return response.result
  }

  return response
}

function parseNumberVector(value: unknown): number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('embedding vector must be a non-empty number array')
  }

  return value.map((item) => {
    if (typeof item !== 'number' || !Number.isFinite(item)) {
      throw new Error('embedding vector contains invalid values')
    }

    return item
  })
}

function assertRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(message)
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
