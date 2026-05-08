import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { TextDecoder } from 'node:util'
import { createRequire } from 'node:module'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { app } = require('../.tmp/evidence-build/worker/app.js')
const { formatMilliseconds, summarizeNumbers } = require('../.tmp/evidence-build/rag/evidence-metrics.js')

const generatedAt = new Date().toISOString()
const date = generatedAt.slice(0, 10)
const evidenceDir = join(root, 'docs', 'evidence')
const markdownPath = join(evidenceDir, `sse-latency-${date}.md`)
const jsonPath = join(evidenceDir, `sse-latency-${date}.json`)
const warmupCount = 10
const sampleCount = 200
const env = { RAG_ACCESS_KEY: 'local-evidence-access-key' }
const samples = []

for (let index = 0; index < warmupCount; index += 1) {
  await runSample(0)
}

for (let index = 0; index < sampleCount; index += 1) {
  samples.push(await runSample(index + 1))
}

const payload = {
  generatedAt,
  checkType: 'mock-sse-latency',
  warmupCount,
  sampleCount,
  summaries: {
    responseReadyMs: summarizeNumbers(samples.map((sample) => sample.responseReadyMs)),
    firstChunkMs: summarizeNumbers(samples.map((sample) => sample.firstChunkMs)),
    firstAnswerDeltaMs: summarizeNumbers(samples.map((sample) => sample.firstAnswerDeltaMs)),
    doneMs: summarizeNumbers(samples.map((sample) => sample.doneMs))
  },
  samples
}

await mkdir(dirname(markdownPath), { recursive: true })
await writeFile(markdownPath, formatMarkdown(payload), 'utf8')
await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`wrote ${markdownPath}`)
console.log(`wrote ${jsonPath}`)

async function runSample(sampleIndex) {
  const startedAt = performance.now()
  const response = await app.request('/api/ask', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RAG_ACCESS_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      question: 'リモート勤務の申請期限は？',
      topK: 5
    })
  }, env)
  const responseReadyMs = performance.now() - startedAt

  if (response.status !== 200) {
    throw new Error(`unexpected response status: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('missing response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let firstChunkMs = 0
  let firstAnswerDeltaMs = 0
  let doneMs = 0
  let eventCount = 0
  const eventNames = []

  while (true) {
    const { value, done } = await reader.read()
    const now = performance.now()

    if (done) {
      buffer += decoder.decode()
      break
    }

    if (firstChunkMs === 0) {
      firstChunkMs = now - startedAt
    }

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseFrames(buffer)
    buffer = parsed.remaining

    for (const eventName of parsed.eventNames) {
      eventCount += 1
      eventNames.push(eventName)

      if (eventName === 'answer_delta' && firstAnswerDeltaMs === 0) {
        firstAnswerDeltaMs = now - startedAt
      }

      if (eventName === 'done' && doneMs === 0) {
        doneMs = now - startedAt
      }
    }
  }

  const trailing = parseFrames(buffer.trim())

  for (const eventName of trailing.eventNames) {
    const now = performance.now()
    eventCount += 1
    eventNames.push(eventName)

    if (eventName === 'answer_delta' && firstAnswerDeltaMs === 0) {
      firstAnswerDeltaMs = now - startedAt
    }

    if (eventName === 'done' && doneMs === 0) {
      doneMs = now - startedAt
    }
  }

  if (doneMs === 0) {
    doneMs = performance.now() - startedAt
  }

  return {
    sampleIndex,
    status: response.status,
    responseReadyMs,
    firstChunkMs,
    firstAnswerDeltaMs,
    doneMs,
    eventCount,
    eventNames
  }
}

function parseFrames(buffer) {
  const eventNames = []
  let remaining = buffer
  let separatorIndex = remaining.indexOf('\n\n')

  while (separatorIndex >= 0) {
    const frame = remaining.slice(0, separatorIndex).trim()
    remaining = remaining.slice(separatorIndex + 2)

    if (frame.length > 0) {
      const eventLine = frame.split(/\r?\n/).find((line) => line.startsWith('event:'))
      if (eventLine) {
        eventNames.push(eventLine.slice('event:'.length).trim())
      }
    }

    separatorIndex = remaining.indexOf('\n\n')
  }

  return { eventNames, remaining }
}

function formatMarkdown(payload) {
  const summaryRows = [
    ['Response ready', payload.summaries.responseReadyMs],
    ['First chunk', payload.summaries.firstChunkMs],
    ['First answer_delta', payload.summaries.firstAnswerDeltaMs],
    ['Done', payload.summaries.doneMs]
  ].map(([label, summary]) => {
    return `| ${label} | ${summary.count} | ${formatMilliseconds(summary.p50)} | ${formatMilliseconds(summary.p95)} | ${formatMilliseconds(summary.min)} | ${formatMilliseconds(summary.max)} | ${formatMilliseconds(summary.average)} |`
  })

  const displayedSamples = payload.samples.slice(0, 20)
  const sampleRows = displayedSamples.map((sample) => {
    return `| ${sample.sampleIndex} | ${sample.status} | ${formatMilliseconds(sample.responseReadyMs)} | ${formatMilliseconds(sample.firstChunkMs)} | ${formatMilliseconds(sample.firstAnswerDeltaMs)} | ${formatMilliseconds(sample.doneMs)} | ${sample.eventCount} |`
  })

  return `# SSE Latency Evidence

Generated at: ${payload.generatedAt}
Check type: ${payload.checkType}
Result: pass

This evidence measures the project-owned mock \`/api/ask\` SSE path by calling the Hono app in-process. It does not call Claude, Workers AI, Vectorize, D1, or Cloudflare.

Interpretation note: this is a ${payload.sampleCount}-sample in-process mock measurement after ${payload.warmupCount} warm-up calls. The p95 column is valid only for this local mock pipeline. It is not a production latency percentile or SLO for Cloudflare edge, Workers AI, Vectorize, D1, or Anthropic streaming.

## Scope

- Sample count: ${payload.sampleCount}
- Warm-up calls discarded: ${payload.warmupCount}
- Route: \`POST /api/ask\`
- Provider mode: default mock search and mock answer stream
- Question fixture: known-answer remote-work policy question
- Access key value: synthetic local evidence key, not printed in response

## Summary

| Metric | Count | p50 | p95 | Min | Max | Average |
|---|---:|---:|---:|---:|---:|---:|
${summaryRows.join('\n')}

## Samples

The table shows the first ${displayedSamples.length} samples. The full ${payload.sampleCount}-sample dataset is written to the adjacent JSON evidence file.

| Sample | Status | Response ready | First chunk | First answer_delta | Done | Events |
|---:|---:|---:|---:|---:|---:|---:|
${sampleRows.join('\n')}

## Event Sequence

Observed event names across samples:

\`\`\`text
${payload.samples[0]?.eventNames.join(' -> ') ?? ''}
\`\`\`

## Not Claimed

- This is not live Claude latency.
- This is not Workers AI, Vectorize, D1, or Cloudflare edge latency.
- This does not measure large-corpus RAG performance.
- This does not prove provider-mode answer quality.
- This does not establish a production SLO.
`
}
