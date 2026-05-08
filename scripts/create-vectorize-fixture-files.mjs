import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const LIVE_CONFIRM_FLAG = '--confirm-live-vectorize-fixture-embedding'
const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const outputDir = join(root, '.tmp', 'vectorize-fixtures')
const fixtureDir = join(root, 'src', 'fixtures', 'documents')
const require = createRequire(import.meta.url)

await mkdir(buildDir, { recursive: true })
await mkdir(outputDir, { recursive: true })
await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { fixtureDocuments } = require('../.tmp/evidence-build/shared/fixture-documents.js')
const { buildIndexPlan } = require('../.tmp/evidence-build/rag/index-plan.js')
const { WORKERS_AI_EMBEDDING_MODEL, PROVIDER_INDEX_VERSION } = require('../.tmp/evidence-build/rag/provider-search.js')
const { createWorkersAiRestUrl } = require('../.tmp/evidence-build/rag/workers-ai-dimension-probe.js')
const {
  createVectorizeIndexRecords,
  createVectorizeIndexSummary,
  createWorkersAiFixtureEmbeddingTexts,
  serializeVectorizeIndexNdjson
} = require('../.tmp/evidence-build/rag/vectorize-index-files.js')

if (!process.argv.includes(LIVE_CONFIRM_FLAG)) {
  console.error(`Refusing to run live Workers AI fixture embedding. Re-run with ${LIVE_CONFIRM_FLAG} after confirming cost and account scope.`)
  process.exit(1)
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN

if (!accountId || !apiToken) {
  console.error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for the live fixture embedding.')
  process.exit(1)
}

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
const texts = createWorkersAiFixtureEmbeddingTexts(plan.chunks)
const response = await globalThis.fetch(createWorkersAiRestUrl(accountId, WORKERS_AI_EMBEDDING_MODEL), {
  method: 'POST',
  headers: {
    authorization: `Bearer ${apiToken}`,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    text: texts,
    truncate_inputs: false
  })
})
const payload = await response.json()

if (!response.ok) {
  console.error(JSON.stringify({
    ok: false,
    status: response.status,
    statusText: response.statusText
  }, null, 2))
  process.exit(1)
}

const vectors = parseWorkersAiEmbeddingVectors(payload)

if (vectors.length !== plan.chunks.length) {
  console.error(JSON.stringify({
    ok: false,
    error: 'unexpected_vector_count',
    expectedVectorCount: plan.chunks.length,
    actualVectorCount: vectors.length
  }, null, 2))
  process.exit(1)
}

const records = createVectorizeIndexRecords({
  chunks: plan.chunks,
  vectors,
  indexRunId: plan.indexRun.index_run_id
})
const summary = createVectorizeIndexSummary(records, plan.indexRun.index_run_id)
const ndjsonPath = join(outputDir, 'embeddings.ndjson')
const summaryPath = join(outputDir, 'summary.json')

await writeFile(ndjsonPath, serializeVectorizeIndexNdjson(records), 'utf8')
await writeFile(summaryPath, `${JSON.stringify({
  ok: true,
  generatedAt,
  model: WORKERS_AI_EMBEDDING_MODEL,
  files: {
    ndjson: ndjsonPath,
    summary: summaryPath
  },
  summary
}, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({
  ok: true,
  generatedAt,
  model: WORKERS_AI_EMBEDDING_MODEL,
  outputDir,
  summary
}, null, 2))

function parseWorkersAiEmbeddingVectors(response) {
  const unwrappedResponse = response && typeof response === 'object' && !Array.isArray(response) && response.result !== undefined
    ? response.result
    : response

  if (!unwrappedResponse || typeof unwrappedResponse !== 'object' || Array.isArray(unwrappedResponse)) {
    throw new Error('Workers AI embedding response must be an object')
  }

  const candidate = Array.isArray(unwrappedResponse.data) ? unwrappedResponse.data : unwrappedResponse.response

  if (!Array.isArray(candidate)) {
    throw new Error('Workers AI embedding response does not contain embedding vectors')
  }

  return candidate.map((vector) => {
    if (!Array.isArray(vector) || vector.some((item) => typeof item !== 'number' || !Number.isFinite(item))) {
      throw new Error('Workers AI embedding vector contains invalid values')
    }

    return vector
  })
}
