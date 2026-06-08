import type { ChunkRecord } from './index-plan'

export type VectorizeIndexMetadata = {
  chunkId: string
  documentSlug: string
  documentTitle: string
  category: string
  indexVersion: string
  headingPath: string[]
  tags: string[]
  contentHash: string
  indexRunId: string
}

export type VectorizeIndexRecord = {
  id: string
  values: number[]
  metadata: VectorizeIndexMetadata
}

export type VectorizeIndexSummary = {
  indexRunId: string
  indexVersion: string
  vectorCount: number
  chunkIds: string[]
}

type ChunkMetadataJson = {
  documentSlug: string
  documentTitle: string
  category: string
  tags: string[]
  headingPath: string[]
}

export function createWorkersAiFixtureEmbeddingTexts(chunks: readonly ChunkRecord[]): string[] {
  if (chunks.length === 0) {
    throw new Error('fixture chunks are required')
  }

  return chunks.map((chunk) => chunk.content)
}

export function createVectorizeIndexRecords(input: {
  chunks: readonly ChunkRecord[]
  vectors: readonly number[][]
  indexRunId: string
}): VectorizeIndexRecord[] {
  const indexRunId = input.indexRunId.trim()

  if (indexRunId.length === 0) {
    throw new Error('indexRunId is required')
  }

  if (input.chunks.length === 0) {
    throw new Error('fixture chunks are required')
  }

  if (input.chunks.length !== input.vectors.length) {
    throw new Error('chunk and vector counts must match')
  }

  return input.chunks.map((chunk, index) => {
    const metadata = parseChunkMetadataJson(chunk.metadata_json)

    return {
      id: chunk.chunk_id,
      values: parseNumberVector(input.vectors[index]),
      metadata: {
        chunkId: chunk.chunk_id,
        documentSlug: metadata.documentSlug,
        documentTitle: metadata.documentTitle,
        category: metadata.category,
        indexVersion: chunk.index_version,
        headingPath: metadata.headingPath,
        tags: metadata.tags,
        contentHash: chunk.content_hash,
        indexRunId
      }
    }
  })
}

export function serializeVectorizeIndexNdjson(records: readonly VectorizeIndexRecord[]): string {
  if (records.length === 0) {
    throw new Error('vectorize records are required')
  }

  return `${records.map((record) => JSON.stringify(record)).join('\n')}\n`
}

export function createVectorizeIndexSummary(records: readonly VectorizeIndexRecord[], indexRunId: string): VectorizeIndexSummary {
  const normalizedIndexRunId = indexRunId.trim()

  if (normalizedIndexRunId.length === 0) {
    throw new Error('indexRunId is required')
  }

  if (records.length === 0) {
    throw new Error('vectorize records are required')
  }

  return {
    indexRunId: normalizedIndexRunId,
    indexVersion: records[0]?.metadata.indexVersion ?? '',
    vectorCount: records.length,
    chunkIds: records.map((record) => record.id)
  }
}

function parseChunkMetadataJson(value: string): ChunkMetadataJson {
  const parsed = parseJsonRecord(value, 'chunk metadata must be an object')
  const documentSlug = parseStringField(parsed, 'documentSlug')
  const documentTitle = parseStringField(parsed, 'documentTitle')
  const category = parseStringField(parsed, 'category')
  const tags = parseStringArray(parsed.tags, 'chunk metadata tags must be a string array')
  const headingPath = parseStringArray(parsed.headingPath, 'chunk metadata headingPath must be a string array')

  return {
    documentSlug,
    documentTitle,
    category,
    tags,
    headingPath
  }
}

function parseJsonRecord(value: string, message: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(message)
    }

    return parsed as Record<string, unknown>
  } catch {
    throw new Error(message)
  }
}

function parseStringField(record: Record<string, unknown>, key: string): string {
  const value = record[key]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`chunk metadata ${key} must be a non-empty string`)
  }

  return value
}

function parseStringArray(value: unknown, message: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(message)
  }

  return value
}

function parseNumberVector(value: readonly number[] | undefined): number[] {
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
