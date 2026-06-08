import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const {
  MANUAL_LIVE_RAG_CHECK_CONFIRM_FLAG,
  createManualLiveCheckCases,
  createManualLiveCheckRequestBody,
  evaluateManualLiveCheckCase,
  readRagSsePayloads,
  summarizeRagSsePayloads
} = require('../.tmp/evidence-build/rag/manual-live-check.js')

if (!process.argv.includes(MANUAL_LIVE_RAG_CHECK_CONFIRM_FLAG)) {
  console.error(`Refusing to run manual live RAG check. Re-run with ${MANUAL_LIVE_RAG_CHECK_CONFIRM_FLAG} after confirming cost and access scope.`)
  process.exit(1)
}

const baseUrl = process.env.RAG_LIVE_CHECK_URL
const accessKey = process.env.RAG_ACCESS_KEY

if (!baseUrl || !accessKey) {
  console.error('RAG_LIVE_CHECK_URLとRAG_ACCESS_KEYが必要です。確認用キーを出力したりcommitしたりしないでください。')
  process.exit(1)
}

const generatedAt = new Date().toISOString()
const url = new globalThis.URL('/api/ask', baseUrl)
const results = []

for (const testCase of createManualLiveCheckCases()) {
  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(createManualLiveCheckRequestBody(testCase))
  })

  if (!response.ok || !response.body) {
    const result = {
      id: testCase.id,
      ok: false,
      status: response.status,
      statusText: response.statusText,
      summary: null,
      failedAssertions: ['httpOk', 'responseBody']
    }
    results.push(result)
    break
  }

  const payloads = await readRagSsePayloads(response.body)
  const summary = summarizeRagSsePayloads(payloads, [accessKey])
  const evaluation = evaluateManualLiveCheckCase(testCase, summary)

  const result = {
    id: testCase.id,
    ok: evaluation.ok,
    status: response.status,
    statusText: response.statusText,
    summary,
    failedAssertions: evaluation.failedAssertions
  }
  results.push(result)

  if (!result.ok) {
    break
  }
}

const output = {
  ok: results.every((result) => result.ok),
  generatedAt,
  scope: {
    knownAnswerRequests: results.filter((result) => result.id === 'known-answer').length,
    noAnswerRequests: results.filter((result) => result.id === 'no-answer').length,
    bulkEval: false,
    loadTest: false,
    privateDocuments: false
  },
  results
}

const outputDir = join(root, '.tmp', 'manual-live-rag-check')
await mkdir(outputDir, { recursive: true })
await writeFile(join(outputDir, 'summary.json'), JSON.stringify(output, null, 2), 'utf8')

console.log(JSON.stringify(output, null, 2))
