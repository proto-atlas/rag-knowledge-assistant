import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fixtureDocuments } from '../../src/shared/fixture-documents'
import { FIXTURE_CHUNK_COUNT, FIXTURE_DOCUMENT_COUNT, FIXTURE_INDEX_VERSION } from '../../src/shared/fixture-index-summary'
import { buildIndexPlan, type SourceDocument } from '../../src/rag/index-plan'

const fixtureDirectory = join(process.cwd(), 'src', 'fixtures', 'documents')
const options = {
  indexRunId: 'index-run-test-001',
  indexVersion: FIXTURE_INDEX_VERSION,
  embeddingModel: '@cf/baai/bge-m3',
  vectorizeIndexName: 'rag_chunks_bge_m3_v1',
  nowIso: '2026-04-30T00:00:00.000Z'
}

describe('buildIndexPlan', () => {
  it('fixture全体からdocument recordとchunk recordを生成する', () => {
    const plan = buildIndexPlan(loadSourceDocuments(), options)

    expect(plan.documents).toHaveLength(FIXTURE_DOCUMENT_COUNT)
    expect(plan.chunks).toHaveLength(FIXTURE_CHUNK_COUNT)
  })

  it('Vectorize metadata用JSONにchunk本文全文を含めない', () => {
    const plan = buildIndexPlan(loadSourceDocuments(), options)
    const firstChunk = plan.chunks[0]
    const metadata = JSON.parse(firstChunk.metadata_json) as { documentSlug: string; charCount: number }

    expect(metadata.documentSlug).toBe('remote-work-policy')
    expect(metadata.charCount).toBe(172)
    expect(firstChunk.metadata_json.includes(firstChunk.content)).toBe(false)
  })

  it('chunk record idにchunk idとindexVersionを含める', () => {
    const plan = buildIndexPlan(loadSourceDocuments(), options)

    expect(plan.chunks[0]?.chunk_record_id).toBe('fixture-corpus-v1__remote-work-policy__s1__c1')
  })

  it('catalog titleとMarkdown titleが違うと例外を投げる', () => {
    const sourceDocuments = loadSourceDocuments()
    const brokenSource = {
      ...sourceDocuments[0],
      markdown: sourceDocuments[0].markdown.replace('# リモート勤務規程', '# 別タイトル')
    }

    expect(() => buildIndexPlan([brokenSource], options)).toThrow('Fixture title mismatch: remote-work-policy')
  })

  it('index run recordにembedding modelとVectorize index名を残す', () => {
    const plan = buildIndexPlan(loadSourceDocuments(), options)

    expect(plan.indexRun).toEqual({
      index_run_id: 'index-run-test-001',
      index_version: 'fixture-corpus-v1',
      embedding_model: '@cf/baai/bge-m3',
      vectorize_index_name: 'rag_chunks_bge_m3_v1',
      status: 'running',
      started_at: '2026-04-30T00:00:00.000Z',
      completed_at: null,
      error_code: null,
      notes: null
    })
  })
})

function loadSourceDocuments(): SourceDocument[] {
  return fixtureDocuments.map((summary) => ({
    summary,
    markdown: readFileSync(join(fixtureDirectory, `${summary.slug}.md`), 'utf8')
  }))
}
