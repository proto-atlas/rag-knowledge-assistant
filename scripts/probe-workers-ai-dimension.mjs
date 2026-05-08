import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const LIVE_CONFIRM_FLAG = '--confirm-live-workers-ai-probe'
const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const {
  createWorkersAiDimensionProbeSummary,
  createWorkersAiEmbeddingProbeRequest,
  createWorkersAiRestUrl
} = require('../.tmp/evidence-build/rag/workers-ai-dimension-probe.js')
const { WORKERS_AI_EMBEDDING_MODEL } = require('../.tmp/evidence-build/rag/provider-search.js')

if (!process.argv.includes(LIVE_CONFIRM_FLAG)) {
  console.error(`Refusing to run live Workers AI probe. Re-run with ${LIVE_CONFIRM_FLAG} after confirming cost and account scope.`)
  process.exit(1)
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN

if (!accountId || !apiToken) {
  console.error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for the live probe.')
  process.exit(1)
}

const url = createWorkersAiRestUrl(accountId, WORKERS_AI_EMBEDDING_MODEL)
const response = await globalThis.fetch(url, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${apiToken}`,
    'content-type': 'application/json'
  },
  body: JSON.stringify(createWorkersAiEmbeddingProbeRequest())
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

const summary = createWorkersAiDimensionProbeSummary(payload, WORKERS_AI_EMBEDDING_MODEL)

console.log(JSON.stringify({
  ok: true,
  generatedAt: new Date().toISOString(),
  summary
}, null, 2))
