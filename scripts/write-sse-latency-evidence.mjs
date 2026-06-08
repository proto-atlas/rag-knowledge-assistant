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

  return `# SSE latency記録

生成日時: ${payload.generatedAt}
確認種別: ${payload.checkType}
結果: pass

この記録では、Hono appをin-processで呼び出し、project-owned mock \`/api/ask\` SSE pathを計測する。Claude、Workers AI、Vectorize、D1、Cloudflareは呼び出さない。

読み方: ${payload.warmupCount}回のwarm-up後に実施した、${payload.sampleCount}件のin-process mock計測です。p95列はこのlocal mock pipelineだけに対する値であり、Cloudflare edge、Workers AI、Vectorize、D1、Anthropic streamingのproduction latency percentileやSLOではありません。

## 対象

- サンプル数: ${payload.sampleCount}
- 集計から除外したwarm-up呼び出し: ${payload.warmupCount}
- Route: \`POST /api/ask\`
- 実行経路: 既定のmock searchとmock answer stream
- 質問fixture: 回答が分かっているリモートワーク規程の質問
- 確認用キー値: synthetic local evidence key。レスポンスには出力しない

## 集計

| Metric | Count | p50 | p95 | Min | Max | Average |
|---|---:|---:|---:|---:|---:|---:|
${summaryRows.join('\n')}

## サンプル

表には最初の${displayedSamples.length}件だけを表示する。${payload.sampleCount}件分のdataset全体は隣接するJSON evidence fileに書き出す。

| Sample | Status | Response ready | First chunk | First answer_delta | Done | Events |
|---:|---:|---:|---:|---:|---:|---:|
${sampleRows.join('\n')}

## イベント列

sampleで観測したevent names:

\`\`\`text
${payload.samples[0]?.eventNames.join(' -> ') ?? ''}
\`\`\`

## この記録に含めない範囲

- Claude実APIのlatencyではない。
- Workers AI、Vectorize、D1、Cloudflare edge latencyではない。
- large-corpus RAG performanceは計測していない。
- provider-mode answer qualityの証明ではない。
- production SLOを設定するものではない。
`
}
