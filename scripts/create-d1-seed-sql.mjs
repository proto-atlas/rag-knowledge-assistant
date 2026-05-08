import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const outputDir = join(root, '.tmp', 'd1-seed')
const fixtureDir = join(root, 'src', 'fixtures', 'documents')
const require = createRequire(import.meta.url)

await mkdir(buildDir, { recursive: true })
await mkdir(outputDir, { recursive: true })
await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { fixtureDocuments } = require('../.tmp/evidence-build/shared/fixture-documents.js')
const { buildIndexPlan } = require('../.tmp/evidence-build/rag/index-plan.js')
const { createD1SeedSql } = require('../.tmp/evidence-build/rag/d1-seed-sql.js')
const { WORKERS_AI_EMBEDDING_MODEL, PROVIDER_INDEX_VERSION } = require('../.tmp/evidence-build/rag/provider-search.js')

const generatedAt = new Date().toISOString()
const sourceDocuments = await Promise.all(fixtureDocuments.map(async (summary) => ({
  summary,
  markdown: await readFile(join(fixtureDir, `${summary.slug}.md`), 'utf8')
})))

const plan = buildIndexPlan(sourceDocuments, {
  indexRunId: `seed-${PROVIDER_INDEX_VERSION}`,
  indexVersion: PROVIDER_INDEX_VERSION,
  embeddingModel: WORKERS_AI_EMBEDDING_MODEL,
  vectorizeIndexName: PROVIDER_INDEX_VERSION,
  nowIso: generatedAt,
  status: 'succeeded'
})

const sqlPath = join(outputDir, 'seed.sql')
const summaryPath = join(outputDir, 'summary.json')
const sql = createD1SeedSql(plan)
const summary = {
  ok: true,
  generatedAt,
  indexRunId: plan.indexRun.index_run_id,
  indexVersion: plan.indexRun.index_version,
  embeddingModel: plan.indexRun.embedding_model,
  vectorizeIndexName: plan.indexRun.vectorize_index_name,
  documentCount: plan.documents.length,
  chunkCount: plan.chunks.length,
  sqlFile: '.tmp/d1-seed/seed.sql'
}

await writeFile(sqlPath, sql, 'utf8')
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

console.log(JSON.stringify(summary, null, 2))
