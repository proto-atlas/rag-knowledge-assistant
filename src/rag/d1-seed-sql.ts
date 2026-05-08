import type { ChunkRecord, DocumentRecord, IndexPlan, IndexRunRecord } from './index-plan'

export function createD1SeedSql(plan: IndexPlan): string {
  const statements = [
    `DELETE FROM chunks WHERE index_version = ${sqlString(plan.indexRun.index_version)};`,
    createIndexRunUpsert(plan.indexRun),
    ...plan.documents.map(createDocumentUpsert),
    ...plan.chunks.map(createChunkInsert)
  ]

  return `${statements.join('\n\n')}\n`
}

function createIndexRunUpsert(record: IndexRunRecord): string {
  return [
    'INSERT INTO index_runs (',
    '  index_run_id, index_version, embedding_model, vectorize_index_name, status, started_at, completed_at, error_code, notes',
    ') VALUES (',
    [
      record.index_run_id,
      record.index_version,
      record.embedding_model,
      record.vectorize_index_name,
      record.status,
      record.started_at,
      record.completed_at,
      record.error_code,
      record.notes
    ].map(sqlString).join(', '),
    ')',
    'ON CONFLICT(index_run_id) DO UPDATE SET',
    '  index_version = excluded.index_version,',
    '  embedding_model = excluded.embedding_model,',
    '  vectorize_index_name = excluded.vectorize_index_name,',
    '  status = excluded.status,',
    '  started_at = excluded.started_at,',
    '  completed_at = excluded.completed_at,',
    '  error_code = excluded.error_code,',
    '  notes = excluded.notes;'
  ].join('\n')
}

function createDocumentUpsert(record: DocumentRecord): string {
  return [
    'INSERT INTO documents (',
    '  document_id, slug, title, category, document_hash, active_index_version, created_at, updated_at',
    ') VALUES (',
    [
      record.document_id,
      record.slug,
      record.title,
      record.category,
      record.document_hash,
      record.active_index_version,
      record.created_at,
      record.updated_at
    ].map(sqlString).join(', '),
    ')',
    'ON CONFLICT(document_id) DO UPDATE SET',
    '  slug = excluded.slug,',
    '  title = excluded.title,',
    '  category = excluded.category,',
    '  document_hash = excluded.document_hash,',
    '  active_index_version = excluded.active_index_version,',
    '  updated_at = excluded.updated_at;'
  ].join('\n')
}

function createChunkInsert(record: ChunkRecord): string {
  return [
    'INSERT INTO chunks (',
    '  chunk_record_id, chunk_id, document_id, index_run_id, index_version, chunk_order, heading_path, content, content_hash, char_count, estimated_token_count, active, metadata_json, created_at',
    ') VALUES (',
    [
      sqlString(record.chunk_record_id),
      sqlString(record.chunk_id),
      sqlString(record.document_id),
      sqlString(record.index_run_id),
      sqlString(record.index_version),
      sqlNumber(record.chunk_order),
      sqlString(record.heading_path),
      sqlString(record.content),
      sqlString(record.content_hash),
      sqlNumber(record.char_count),
      sqlNumber(record.estimated_token_count),
      sqlNumber(record.active),
      sqlString(record.metadata_json),
      sqlString(record.created_at)
    ].join(', '),
    ');'
  ].join('\n')
}

function sqlString(value: string | null): string {
  if (value === null) {
    return 'NULL'
  }

  return `'${value.replaceAll("'", "''")}'`
}

function sqlNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('SQL numeric value must be finite')
  }

  return String(value)
}
