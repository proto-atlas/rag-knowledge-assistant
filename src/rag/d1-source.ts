import type { FixtureCategory } from '../shared/fixture-documents'
import type { SearchCorpusChunk } from './search-types'

export type D1BoundValue = string | number | null

export type D1DatabaseLike = {
  prepare(query: string): {
    bind(...values: D1BoundValue[]): {
      all<T = unknown>(): Promise<{ results?: T[] }>
    }
  }
}

export type D1ActiveChunkRow = {
  chunk_id: string
  document_slug: string
  document_title: string
  document_category: string
  index_version: string
  heading_path: string
  content: string
  metadata_json: string
}

type ChunkMetadata = {
  tags: string[]
  headingPath?: string[]
}

export async function getActiveChunksByIds(
  db: D1DatabaseLike,
  chunkIds: string[],
  activeIndexVersion: string
): Promise<Map<string, SearchCorpusChunk>> {
  const normalizedIndexVersion = activeIndexVersion.trim()

  if (normalizedIndexVersion.length === 0) {
    throw new Error('activeIndexVersion is required')
  }

  const normalizedChunkIds = normalizeChunkIds(chunkIds)

  if (normalizedChunkIds.length === 0) {
    return new Map()
  }

  // D1 supports anonymous prepared-statement placeholders. Only the placeholder
  // count is interpolated here; chunk ids and index version are bound values.
  const placeholders = normalizedChunkIds.map(() => '?').join(', ')
  const statement = db.prepare(`
    SELECT
      c.chunk_id,
      d.slug AS document_slug,
      d.title AS document_title,
      d.category AS document_category,
      c.index_version,
      c.heading_path,
      c.content,
      c.metadata_json
    FROM chunks c
    JOIN documents d ON d.document_id = c.document_id
    WHERE c.active = 1
      AND c.index_version = ?
      AND c.chunk_id IN (${placeholders})
    ORDER BY c.chunk_order ASC
  `)

  const result = await statement.bind(normalizedIndexVersion, ...normalizedChunkIds).all<D1ActiveChunkRow>()
  const chunks = new Map<string, SearchCorpusChunk>()

  for (const row of result.results ?? []) {
    const chunk = parseD1ActiveChunkRow(row)
    chunks.set(chunk.chunkId, chunk)
  }

  return chunks
}

export function parseD1ActiveChunkRow(row: D1ActiveChunkRow): SearchCorpusChunk {
  const category = parseFixtureCategory(row.document_category)
  const headingPath = parseStringArrayJson(row.heading_path, 'D1 chunk heading_path must be a string array')
  const metadata = parseChunkMetadata(row.metadata_json)

  return {
    chunkId: row.chunk_id,
    documentSlug: row.document_slug,
    documentTitle: row.document_title,
    category,
    tags: metadata.tags,
    headingPath,
    content: row.content,
    indexVersion: row.index_version
  }
}

function normalizeChunkIds(chunkIds: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const chunkId of chunkIds) {
    const trimmed = chunkId.trim()

    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue
    }

    seen.add(trimmed)
    normalized.push(trimmed)
  }

  return normalized
}

function parseChunkMetadata(value: string): ChunkMetadata {
  const record = parseJsonRecord(value, 'D1 chunk metadata_json must be an object')
  const tags = parseStringArray(record.tags, 'D1 chunk metadata tags must be a string array')
  const headingPath = record.headingPath === undefined
    ? undefined
    : parseStringArray(record.headingPath, 'D1 chunk metadata headingPath must be a string array')

  return { tags, headingPath }
}

function parseStringArrayJson(value: string, message: string): string[] {
  return parseStringArray(parseJsonValue(value, message), message)
}

function parseJsonRecord(value: string, message: string): Record<string, unknown> {
  const parsed = parseJsonValue(value, message)

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(message)
  }

  return parsed as Record<string, unknown>
}

function parseJsonValue(value: string, message: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    throw new Error(message)
  }
}

function parseStringArray(value: unknown, message: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(message)
  }

  return value
}

function parseFixtureCategory(value: string): FixtureCategory {
  if (
    value === 'policy' ||
    value === 'finance' ||
    value === 'security' ||
    value === 'incident' ||
    value === 'onboarding' ||
    value === 'product' ||
    value === 'support' ||
    value === 'release'
  ) {
    return value
  }

  throw new Error('D1 document category is invalid')
}
