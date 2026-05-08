import {
  FIXTURE_CHUNK_COUNT,
  FIXTURE_DOCUMENT_COUNT,
  FIXTURE_INDEX_VERSION,
  FIXTURE_LAST_INDEXED_AT
} from './fixture-index-summary'

export type PublicStatus = {
  documentCount: number
  chunkCount: number
  indexVersion: string
  lastIndexedAt: string | null
}

export const initialPublicStatus: PublicStatus = {
  documentCount: FIXTURE_DOCUMENT_COUNT,
  chunkCount: FIXTURE_CHUNK_COUNT,
  indexVersion: FIXTURE_INDEX_VERSION,
  lastIndexedAt: FIXTURE_LAST_INDEXED_AT
}

export function isPublicStatus(value: unknown): value is PublicStatus {
  if (!isRecord(value)) {
    return false
  }

  return isNonNegativeInteger(value.documentCount)
    && isNonNegativeInteger(value.chunkCount)
    && typeof value.indexVersion === 'string'
    && value.indexVersion.length > 0
    && (value.lastIndexedAt === null || typeof value.lastIndexedAt === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0
}
