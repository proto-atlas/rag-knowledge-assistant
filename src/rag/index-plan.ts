import type { FixtureDocumentSummary } from '../shared/fixture-documents'
import { createChunks } from './chunker'
import { createStableContentHash } from './hash'
import { parseMarkdownDocument } from './markdown'

export type IndexRunStatus = 'running' | 'succeeded' | 'failed'

export type SourceDocument = {
  summary: FixtureDocumentSummary
  markdown: string
}

export type IndexPlanOptions = {
  indexRunId: string
  indexVersion: string
  embeddingModel: string
  vectorizeIndexName: string
  nowIso: string
  status?: IndexRunStatus
}

export type IndexRunRecord = {
  index_run_id: string
  index_version: string
  embedding_model: string
  vectorize_index_name: string
  status: IndexRunStatus
  started_at: string
  completed_at: string | null
  error_code: string | null
  notes: string | null
}

export type DocumentRecord = {
  document_id: string
  slug: string
  title: string
  category: string
  document_hash: string
  active_index_version: string
  created_at: string
  updated_at: string
}

export type ChunkRecord = {
  chunk_record_id: string
  chunk_id: string
  document_id: string
  index_run_id: string
  index_version: string
  chunk_order: number
  heading_path: string
  content: string
  content_hash: string
  char_count: number
  estimated_token_count: number
  active: 0 | 1
  metadata_json: string
  created_at: string
}

export type IndexPlan = {
  indexRun: IndexRunRecord
  documents: DocumentRecord[]
  chunks: ChunkRecord[]
}

export function buildIndexPlan(sourceDocuments: SourceDocument[], options: IndexPlanOptions): IndexPlan {
  const indexRun = createIndexRunRecord(options)
  const documents: DocumentRecord[] = []
  const chunks: ChunkRecord[] = []

  sourceDocuments.forEach((sourceDocument) => {
    const parsedDocument = parseMarkdownDocument(sourceDocument.markdown)

    if (parsedDocument.title !== sourceDocument.summary.title) {
      throw new Error(`Fixture title mismatch: ${sourceDocument.summary.slug}`)
    }

    const documentRecord = createDocumentRecord(sourceDocument, options)
    documents.push(documentRecord)

    const documentChunks = createChunks(sourceDocument.summary, parsedDocument)

    documentChunks.forEach((chunk) => {
      chunks.push({
        chunk_record_id: createChunkRecordId(chunk.chunkId, options.indexVersion),
        chunk_id: chunk.chunkId,
        document_id: documentRecord.document_id,
        index_run_id: options.indexRunId,
        index_version: options.indexVersion,
        chunk_order: chunk.order,
        heading_path: JSON.stringify(chunk.headingPath),
        content: chunk.content,
        content_hash: chunk.contentHash,
        char_count: chunk.charCount,
        estimated_token_count: chunk.estimatedTokenCount,
        active: 1,
        metadata_json: JSON.stringify({
          documentSlug: chunk.documentSlug,
          documentTitle: chunk.documentTitle,
          category: chunk.category,
          tags: chunk.tags,
          headingPath: chunk.headingPath,
          charCount: chunk.charCount
        }),
        created_at: options.nowIso
      })
    })
  })

  return { indexRun, documents, chunks }
}

function createChunkRecordId(chunkId: string, indexVersion: string): string {
  return `${indexVersion}__${chunkId}`
}

function createIndexRunRecord(options: IndexPlanOptions): IndexRunRecord {
  const status = options.status ?? 'running'

  return {
    index_run_id: options.indexRunId,
    index_version: options.indexVersion,
    embedding_model: options.embeddingModel,
    vectorize_index_name: options.vectorizeIndexName,
    status,
    started_at: options.nowIso,
    completed_at: status === 'running' ? null : options.nowIso,
    error_code: null,
    notes: null
  }
}

function createDocumentRecord(sourceDocument: SourceDocument, options: IndexPlanOptions): DocumentRecord {
  return {
    document_id: sourceDocument.summary.slug,
    slug: sourceDocument.summary.slug,
    title: sourceDocument.summary.title,
    category: sourceDocument.summary.category,
    document_hash: createStableContentHash(sourceDocument.markdown),
    active_index_version: options.indexVersion,
    created_at: options.nowIso,
    updated_at: options.nowIso
  }
}
