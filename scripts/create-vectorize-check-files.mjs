import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const LIVE_CONFIRM_FLAG = '--confirm-live-vectorize-check-embedding'
const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const outputDir = join(root, '.tmp', 'vectorize-check')
const require = createRequire(import.meta.url)

await mkdir(buildDir, { recursive: true })
await mkdir(outputDir, { recursive: true })
await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { mockSearchCorpus } = require('../.tmp/evidence-build/rag/mock-corpus.js')
const { WORKERS_AI_EMBEDDING_MODEL } = require('../.tmp/evidence-build/rag/provider-search.js')
const { createWorkersAiRestUrl } = require('../.tmp/evidence-build/rag/workers-ai-dimension-probe.js')
const {
  DEFAULT_VECTORIZE_CHECK_QUERY,
  createVectorizeCheckRecords,
  createVectorizeCheckSummary,
  createWorkersAiEmbeddingBatchRequest,
  parseWorkersAiEmbeddingVectors,
  selectVectorizeCheckChunks,
  serializeVectorizeCheckNdjson
} = require('../.tmp/evidence-build/rag/vectorize-check.js')

if (!process.argv.includes(LIVE_CONFIRM_FLAG)) {
  console.error(`Refusing to run live Workers AI check embedding. Re-run with ${LIVE_CONFIRM_FLAG} after confirming cost and account scope.`)
  process.exit(1)
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN

if (!accountId || !apiToken) {
  console.error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for the live check embedding.')
  process.exit(1)
}

const checkRunId = `vectorize-check-${new Date().toISOString().replace(/[:.]/g, '-')}`
const chunks = selectVectorizeCheckChunks(mockSearchCorpus)
const request = createWorkersAiEmbeddingBatchRequest({
  chunks,
  queryText: DEFAULT_VECTORIZE_CHECK_QUERY
})

const response = await globalThis.fetch(createWorkersAiRestUrl(accountId, WORKERS_AI_EMBEDDING_MODEL), {
  method: 'POST',
  headers: {
    authorization: `Bearer ${apiToken}`,
    'content-type': 'application/json'
  },
  body: JSON.stringify(request)
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
const expectedVectorCount = chunks.length + 1

if (vectors.length !== expectedVectorCount) {
  console.error(JSON.stringify({
    ok: false,
    error: 'unexpected_vector_count',
    expectedVectorCount,
    actualVectorCount: vectors.length
  }, null, 2))
  process.exit(1)
}

const records = createVectorizeCheckRecords({
  chunks,
  vectors: vectors.slice(0, chunks.length),
  checkRunId
})
const queryVector = vectors[vectors.length - 1]
const summary = createVectorizeCheckSummary({
  records,
  queryText: DEFAULT_VECTORIZE_CHECK_QUERY,
  queryVector,
  checkRunId
})

const ndjsonPath = join(outputDir, 'embeddings.ndjson')
const queryVectorPath = join(outputDir, 'query-vector.json')
const summaryPath = join(outputDir, 'summary.json')

await writeFile(ndjsonPath, serializeVectorizeCheckNdjson(records))
await writeFile(queryVectorPath, JSON.stringify(queryVector))
await writeFile(summaryPath, `${JSON.stringify({
  ok: true,
  generatedAt: new Date().toISOString(),
  model: WORKERS_AI_EMBEDDING_MODEL,
  files: {
    ndjson: ndjsonPath,
    queryVector: queryVectorPath,
    summary: summaryPath
  },
  summary
}, null, 2)}\n`)

console.log(JSON.stringify({
  ok: true,
  generatedAt: new Date().toISOString(),
  model: WORKERS_AI_EMBEDDING_MODEL,
  outputDir,
  summary
}, null, 2))
