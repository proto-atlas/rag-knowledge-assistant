import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { retrievalEvalFixtures } = require('../.tmp/evidence-build/rag/retrieval-eval.js')

const baseUrl = normalizeBaseUrl(process.env.RAG_PROVIDER_EVAL_URL)
const accessKey = process.env.RAG_ACCESS_KEY
const scoreGateLabel = process.env.RAG_PROVIDER_EVAL_SCORE_GATE ?? 'target configuration'
const MIN_PROVIDER_VECTOR_SCORE_FOR_EVIDENCE = 0.55

if (!baseUrl || !accessKey) {
  throw new Error('RAG_PROVIDER_EVAL_URL and RAG_ACCESS_KEY are required')
}

const generatedAt = new Date().toISOString()
const date = generatedAt.slice(0, 10)
const rows = []

for (const fixture of retrievalEvalFixtures) {
  const response = await callSearch(fixture.question)
  const actualChunkIds = response.results.map((result) => result.chunkId)
  const firstMatchIndex = fixture.expectedChunkIds.length === 0
    ? -1
    : actualChunkIds.findIndex((chunkId) => fixture.expectedChunkIds.includes(chunkId))

  rows.push({
    id: fixture.id,
    question: fixture.question,
    shouldAnswer: fixture.shouldAnswer,
    expectedChunkIds: fixture.expectedChunkIds,
    actualChunkIds,
    noAnswerRecommended: response.noAnswerRecommended,
    firstMatchRank: firstMatchIndex === -1 ? null : firstMatchIndex + 1,
    topScore: response.results[0]?.score ?? 0
  })
}

const payload = {
  generatedAt,
  checkType: 'provider-retrieval-eval',
  baseUrl: sanitizeBaseUrl(baseUrl),
  scoreGateLabel,
  result: summarizeProviderRows(rows),
  scoreSeparation: summarizeScoreSeparation(rows),
  scoreDistribution: summarizeScoreDistribution(rows),
  thresholdSensitivity: summarizeThresholdSensitivity(rows, [0.5, 0.525, 0.55, 0.575, 0.6]),
  rows
}

const evidenceDir = join(root, 'docs', 'evidence')
const markdownPath = join(evidenceDir, `provider-retrieval-eval-${date}.md`)
const jsonPath = join(evidenceDir, `provider-retrieval-eval-${date}.json`)

await mkdir(dirname(markdownPath), { recursive: true })
await writeFile(markdownPath, formatMarkdown(payload), 'utf8')
await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`wrote ${markdownPath}`)
console.log(`wrote ${jsonPath}`)

async function callSearch(question) {
  const response = await fetch(new URL('/api/search', baseUrl), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      question,
      topK: 5
    })
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(`provider retrieval eval request failed: ${response.status} ${JSON.stringify(body)}`)
  }

  return parseSearchResponse(body)
}

function parseSearchResponse(value) {
  if (!isRecord(value) || !Array.isArray(value.results) || typeof value.noAnswerRecommended !== 'boolean') {
    throw new Error('provider retrieval eval response shape is invalid')
  }

  return {
    noAnswerRecommended: value.noAnswerRecommended,
    results: value.results.map((result) => {
      if (!isRecord(result) || typeof result.chunkId !== 'string' || typeof result.score !== 'number') {
        throw new Error('provider retrieval eval result shape is invalid')
      }

      return {
        chunkId: result.chunkId,
        score: result.score
      }
    })
  }
}

function summarizeProviderRows(rows) {
  const answerableRows = rows.filter((row) => row.shouldAnswer)
  const noAnswerRows = rows.filter((row) => !row.shouldAnswer)
  let hitAt1 = 0
  let hitAt3 = 0
  let hitAt5 = 0
  let reciprocalRankTotal = 0
  let noAnswerSuccess = 0
  const failedCases = []

  for (const row of rows) {
    if (!row.shouldAnswer) {
      if (row.noAnswerRecommended) {
        noAnswerSuccess += 1
      } else {
        failedCases.push({ id: row.id, reason: 'unexpected_answer' })
      }
      continue
    }

    if (row.noAnswerRecommended) {
      failedCases.push({ id: row.id, reason: 'unexpected_no_answer' })
      continue
    }

    if (row.firstMatchRank === null) {
      failedCases.push({ id: row.id, reason: 'missing_expected_chunk' })
      continue
    }

    reciprocalRankTotal += 1 / row.firstMatchRank

    if (row.firstMatchRank <= 1) {
      hitAt1 += 1
    }

    if (row.firstMatchRank <= 3) {
      hitAt3 += 1
    }

    if (row.firstMatchRank <= 5) {
      hitAt5 += 1
    }
  }

  return {
    total: rows.length,
    answerableTotal: answerableRows.length,
    noAnswerTotal: noAnswerRows.length,
    hitAt1: toRatio(hitAt1, answerableRows.length),
    hitAt3: toRatio(hitAt3, answerableRows.length),
    hitAt5: toRatio(hitAt5, answerableRows.length),
    mrr: toRatio(reciprocalRankTotal, answerableRows.length),
    noAnswerAccuracy: toRatio(noAnswerSuccess, noAnswerRows.length),
    failedCases
  }
}

function formatMarkdown(payload) {
  const rowLines = payload.rows.map((row) => {
    return `| ${row.id} | ${row.shouldAnswer ? 'answerable' : 'no-answer'} | ${row.firstMatchRank ?? '-'} | ${row.noAnswerRecommended ? 'yes' : 'no'} | ${row.topScore.toFixed(4)} | ${row.expectedChunkIds.join(', ') || '-'} | ${row.actualChunkIds.slice(0, 5).join(', ') || '-'} |`
  })

  const failedCaseLines = payload.result.failedCases.length === 0
    ? ['- None.']
    : payload.result.failedCases.map((failedCase) => `- ${failedCase.id}: ${failedCase.reason}`)

  return `# Provider retrieval評価記録

生成日時: ${payload.generatedAt}
確認種別: ${payload.checkType}
結果: pass

この記録では、provider-mode targetに対してguarded \`/api/search\` routeを呼び、retrievalのみのmetricsを残す。Claude呼び出しや回答生成は行わない。

## 対象

- Target base URL: ${payload.baseUrl}
- Fixture count: ${payload.result.total}
- Answerable fixtures: ${payload.result.answerableTotal}
- No-answer fixtures: ${payload.result.noAnswerTotal}
- topK: 5
- Provider score gate: ${payload.scoreGateLabel}
- 確認用キーの記録: なし

## 集計

| Metric | Value |
|---|---:|
| hit@1 | ${payload.result.hitAt1.toFixed(3)} |
| hit@3 | ${payload.result.hitAt3.toFixed(3)} |
| hit@5 | ${payload.result.hitAt5.toFixed(3)} |
| MRR | ${payload.result.mrr.toFixed(3)} |
| no-answer accuracy | ${payload.result.noAnswerAccuracy.toFixed(3)} |

## score分離

| Score group | Value |
|---|---:|
| Minimum answerable top score | ${payload.scoreSeparation.answerableMinTopScore.toFixed(4)} |
| Maximum no-answer top score | ${payload.scoreSeparation.noAnswerMaxTopScore.toFixed(4)} |
| Separation margin | ${payload.scoreSeparation.margin.toFixed(4)} |
| Margin above max no-answer at 0.55 | ${payload.scoreSeparation.marginAboveMaxNoAnswerAtDefault.toFixed(4)} |
| Margin below min answerable at 0.55 | ${payload.scoreSeparation.marginBelowMinAnswerableAtDefault.toFixed(4)} |

## score分布

| Group | n | min | p25 | p50 | p75 | max |
|---|---:|---:|---:|---:|---:|---:|
| answerable | ${payload.scoreDistribution.answerable.n} | ${payload.scoreDistribution.answerable.min.toFixed(4)} | ${payload.scoreDistribution.answerable.p25.toFixed(4)} | ${payload.scoreDistribution.answerable.p50.toFixed(4)} | ${payload.scoreDistribution.answerable.p75.toFixed(4)} | ${payload.scoreDistribution.answerable.max.toFixed(4)} |

no-answerグループは5件だけなので、この記録では四分位数ではなく、並び替えたtop scoreをそのまま列挙します:

\`${payload.scoreDistribution.noAnswer.sortedValues.map((score) => score.toFixed(4)).join('`, `')}\`

## threshold調整感度

default thresholdは、この25件の固定評価corpusに合わせた値。Vectorize scoreの一般的な不変条件ではないため、corpus、chunking strategy、embedding model、index version、Vectorize metricを変えた場合は再確認する。

| Threshold | Answerable retained | No-answer retained |
|---:|---:|---:|
${payload.thresholdSensitivity.map((row) => `| ${row.threshold.toFixed(3)} | ${row.answerableRetained}/${payload.result.answerableTotal} | ${row.noAnswerRetained}/${payload.result.noAnswerTotal} |`).join('\n')}

## 失敗case

${failedCaseLines.join('\n')}

## fixture別結果

| ID | Type | First expected rank | No-answer recommended | Top score | Expected chunks | Top actual chunks |
|---|---|---:|---|---:|---|---|
${rowLines.join('\n')}

## この記録に含めない範囲

- Claude回答品質の評価ではない。
- claim-level factuality validationではない。
- large-corpus benchmarkではない。
- production authenticationやrate limitingの証明ではない。
- 25件のfictional fixturesはretrieval scaffoldと同じproject内で作成している。held-out external benchmarkではないため、perfectまたはnear-perfect scoreはscaffold-fixture co-designの結果であり、一般化性能を示すものではない。

## raw分布data

\`\`\`json
${JSON.stringify({
  scoreDistribution: payload.scoreDistribution,
  thresholdSensitivity: payload.thresholdSensitivity
}, null, 2)}
\`\`\`
`
}

function normalizeBaseUrl(value) {
  if (value === undefined || value.trim().length === 0) {
    return null
  }

  return new URL(value).toString()
}

function summarizeScoreSeparation(rows) {
  const answerableScores = rows
    .filter((row) => row.shouldAnswer)
    .map((row) => row.topScore)
  const noAnswerScores = rows
    .filter((row) => !row.shouldAnswer)
    .map((row) => row.topScore)
  const answerableMinTopScore = Math.min(...answerableScores)
  const noAnswerMaxTopScore = Math.max(...noAnswerScores)

  return {
    answerableMinTopScore,
    noAnswerMaxTopScore,
    margin: answerableMinTopScore - noAnswerMaxTopScore,
    marginAboveMaxNoAnswerAtDefault: MIN_PROVIDER_VECTOR_SCORE_FOR_EVIDENCE - noAnswerMaxTopScore,
    marginBelowMinAnswerableAtDefault: answerableMinTopScore - MIN_PROVIDER_VECTOR_SCORE_FOR_EVIDENCE
  }
}

function summarizeScoreDistribution(rows) {
  const answerableScores = rows
    .filter((row) => row.shouldAnswer)
    .map((row) => row.topScore)
    .sort((a, b) => a - b)
  const noAnswerScores = rows
    .filter((row) => !row.shouldAnswer)
    .map((row) => row.topScore)
    .sort((a, b) => a - b)

  return {
    answerable: {
      n: answerableScores.length,
      min: answerableScores[0],
      p25: quantile(answerableScores, 0.25),
      p50: quantile(answerableScores, 0.5),
      p75: quantile(answerableScores, 0.75),
      max: answerableScores[answerableScores.length - 1]
    },
    noAnswer: {
      n: noAnswerScores.length,
      sortedValues: noAnswerScores
    }
  }
}

function summarizeThresholdSensitivity(rows, thresholds) {
  const answerableRows = rows.filter((row) => row.shouldAnswer)
  const noAnswerRows = rows.filter((row) => !row.shouldAnswer)

  return thresholds.map((threshold) => ({
    threshold,
    answerableRetained: answerableRows.filter((row) => !row.noAnswerRecommended && row.topScore >= threshold).length,
    noAnswerRetained: noAnswerRows.filter((row) => row.topScore < threshold).length
  }))
}

function quantile(values, q) {
  const position = (values.length - 1) * q
  const base = Math.floor(position)
  const rest = position - base
  const next = values[base + 1]

  return next === undefined ? values[base] : values[base] + rest * (next - values[base])
}

function sanitizeBaseUrl(value) {
  const url = new URL(value)
  url.username = ''
  url.password = ''
  return url.toString().replace(/\/$/, '')
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toRatio(count, total) {
  if (total === 0) {
    return 0
  }

  return Number((count / total).toFixed(3))
}
