import type { FixtureCategory } from '../shared/fixture-documents'
import type { SearchCorpusChunk, SearchRequest, SearchResponse, SearchResult } from './search-types'

export const WORKERS_AI_EMBEDDING_MODEL = '@cf/baai/bge-m3'
export const PROVIDER_INDEX_VERSION = 'rag-bge-m3-v1'
// この固定データ検証環境の確認用データ索引向け暫定値。corpusやmetric変更時は再校正する。
export const MIN_PROVIDER_VECTOR_SCORE = 0.55

export type WorkersAiBinding = {
  run(model: string, input: { text: string | string[]; truncate_inputs?: boolean }): Promise<unknown>
}

export type VectorizeMetadataFilter = {
  indexVersion: {
    $eq: string
  }
  category?: {
    $eq: FixtureCategory
  }
}

export type VectorizeQueryOptions = {
  topK: number
  returnMetadata: 'all'
  filter: VectorizeMetadataFilter
}

export type VectorizeIndexBinding = {
  query(vector: number[], options: VectorizeQueryOptions): Promise<unknown>
}

export type VectorizeMatchMetadata = {
  chunkId?: string
  documentSlug?: string
  category?: FixtureCategory
  indexVersion?: string
  checkRunId?: string
}

export type VectorizeMatch = {
  id: string
  score: number
  metadata?: VectorizeMatchMetadata
}

export function createVectorizeQueryOptions(
  request: SearchRequest,
  activeIndexVersion: string
): VectorizeQueryOptions {
  const normalizedIndexVersion = activeIndexVersion.trim()

  if (normalizedIndexVersion.length === 0) {
    throw new Error('activeIndexVersion is required')
  }

  const filter: VectorizeMetadataFilter = {
    indexVersion: {
      $eq: normalizedIndexVersion
    }
  }

  if (request.category) {
    filter.category = {
      $eq: request.category
    }
  }

  return {
    topK: request.topK,
    returnMetadata: 'all',
    filter
  }
}

export function parseFirstWorkersAiEmbeddingVector(response: unknown): number[] {
  const record = assertRecord(response, 'Workers AI embedding response must be an object')
  const candidate = pickFirstEmbeddingCandidate(record)

  if (!Array.isArray(candidate)) {
    throw new Error('Workers AI embedding response does not contain an embedding vector')
  }

  return parseNumberVector(candidate, 'Workers AI embedding vector contains invalid values')
}

export function parseVectorizeMatches(response: unknown): VectorizeMatch[] {
  const record = assertRecord(response, 'Vectorize query response must be an object')

  if (!Array.isArray(record.matches)) {
    throw new Error('Vectorize query response does not contain matches')
  }

  return record.matches.map((match) => parseVectorizeMatch(match))
}

export function createSearchResponseFromVectorMatches(input: {
  request: SearchRequest
  activeIndexVersion: string
  matches: VectorizeMatch[]
  chunksById: ReadonlyMap<string, SearchCorpusChunk>
  minScore?: number
}): SearchResponse {
  const minScore = input.minScore ?? MIN_PROVIDER_VECTOR_SCORE

  if (!Number.isFinite(minScore)) {
    throw new Error('minScore must be finite')
  }

  const results: SearchResult[] = []

  for (const match of input.matches) {
    const chunkId = match.metadata?.chunkId ?? match.id
    const chunk = input.chunksById.get(chunkId)

    if (!chunk) {
      continue
    }

    if (chunk.indexVersion !== input.activeIndexVersion) {
      continue
    }

    if (input.request.category && chunk.category !== input.request.category) {
      continue
    }

    results.push(toSearchResult(chunk, match.score, results.length))

    if (results.length >= input.request.topK) {
      break
    }
  }

  const topScore = results[0]?.score ?? 0

  return {
    query: input.request.question,
    topK: input.request.topK,
    indexVersion: input.activeIndexVersion,
    noAnswerRecommended: topScore < minScore,
    results
  }
}

function pickFirstEmbeddingCandidate(record: Record<string, unknown>): unknown {
  if (Array.isArray(record.data)) {
    return record.data[0]
  }

  if (Array.isArray(record.response)) {
    return record.response[0]
  }

  return undefined
}

function parseNumberVector(value: unknown[], errorMessage: string): number[] {
  if (value.length === 0) {
    throw new Error(errorMessage)
  }

  return value.map((item) => {
    if (typeof item !== 'number' || !Number.isFinite(item)) {
      throw new Error(errorMessage)
    }

    return item
  })
}

function parseVectorizeMatch(value: unknown): VectorizeMatch {
  const record = assertRecord(value, 'Vectorize match must be an object')

  if (typeof record.id !== 'string' || record.id.trim().length === 0) {
    throw new Error('Vectorize match id must be a non-empty string')
  }

  if (typeof record.score !== 'number' || !Number.isFinite(record.score)) {
    throw new Error('Vectorize match score must be finite')
  }

  const metadata = record.metadata === undefined ? undefined : parseVectorizeMetadata(record.metadata)

  return {
    id: record.id,
    score: record.score,
    metadata
  }
}

function parseVectorizeMetadata(value: unknown): VectorizeMatchMetadata {
  const record = assertRecord(value, 'Vectorize metadata must be an object')
  const metadata: VectorizeMatchMetadata = {}

  copyStringField(record, metadata, 'chunkId')
  copyStringField(record, metadata, 'documentSlug')
  copyFixtureCategoryField(record, metadata)
  copyStringField(record, metadata, 'indexVersion')
  copyStringField(record, metadata, 'checkRunId')

  return metadata
}

function copyStringField<T extends 'chunkId' | 'documentSlug' | 'indexVersion' | 'checkRunId'>(
  source: Record<string, unknown>,
  target: Pick<VectorizeMatchMetadata, T>,
  key: T
): void {
  const value = source[key]

  if (value === undefined) {
    return
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Vectorize metadata ${key} must be a non-empty string`)
  }

  target[key] = value
}

function copyFixtureCategoryField(
  source: Record<string, unknown>,
  target: Pick<VectorizeMatchMetadata, 'category'>
): void {
  const value = source.category

  if (value === undefined) {
    return
  }

  if (!isFixtureCategory(value)) {
    throw new Error('Vectorize metadata category is invalid')
  }

  target.category = value
}

function toSearchResult(chunk: SearchCorpusChunk, score: number, index: number): SearchResult {
  return {
    sourceId: String(index + 1),
    chunkId: chunk.chunkId,
    documentSlug: chunk.documentSlug,
    documentTitle: chunk.documentTitle,
    headingPath: chunk.headingPath,
    excerpt: chunk.content,
    category: chunk.category,
    tags: chunk.tags,
    score
  }
}

function assertRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message)
  }

  return value as Record<string, unknown>
}

function isFixtureCategory(value: unknown): value is FixtureCategory {
  return (
    value === 'policy' ||
    value === 'finance' ||
    value === 'security' ||
    value === 'incident' ||
    value === 'onboarding' ||
    value === 'product' ||
    value === 'support' ||
    value === 'release'
  )
}
