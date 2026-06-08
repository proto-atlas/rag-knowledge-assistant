import { createHash } from 'node:crypto'

export type ExternalBenchmarkDocument = {
  docId: string
  title: string
  text: string
}

export type ExternalBenchmarkQuery = {
  id: string
  query: string
  expectedDocIds: string[]
}

export type ExternalBenchmarkRankedDocument = {
  docId: string
  score: number
}

export type ExternalBenchmarkRow = {
  id: string
  query: string
  expectedDocIds: string[]
  firstMatchRank: number | null
  topDocs: ExternalBenchmarkRankedDocument[]
  failureCategory: ExternalBenchmarkFailureCategory | null
}

export type ExternalBenchmarkFailureCategory =
  | 'domain_mismatch'
  | 'normalization_gap'
  | 'long_query_drift'
  | 'synonym_gap'
  | 'gold_granularity_mismatch'
  | 'zero_score'

export type ExternalBenchmarkResult = {
  total: number
  hitAt1: number
  hitAt5: number
  hitAt10: number
  mrr: number
  failed: number
  failureCategories: Record<ExternalBenchmarkFailureCategory, number>
}

export type ExternalBenchmarkPayload = {
  generatedAt: string
  checkType: 'external-benchmark-subset-eval'
  dataset: {
    name: string
    language: 'japanese'
    split: string
    license: string
    sourceUrls: string[]
    queryLimit: number
    negativeDocumentLimit: number
    candidateDocumentCount: number
    inputHash: string
  }
  result: ExternalBenchmarkResult
  rows: ExternalBenchmarkRow[]
}

const FAILURE_CATEGORIES: ExternalBenchmarkFailureCategory[] = [
  'domain_mismatch',
  'normalization_gap',
  'long_query_drift',
  'synonym_gap',
  'gold_granularity_mismatch',
  'zero_score'
]

export function rankExternalDocuments(
  query: string,
  documents: ExternalBenchmarkDocument[],
  topK: number
): ExternalBenchmarkRankedDocument[] {
  const terms = extractExternalBenchmarkTerms(query)

  return documents
    .map((document) => ({
      docId: document.docId,
      score: scoreExternalBenchmarkDocument(query, terms, document)
    }))
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score || left.docId.localeCompare(right.docId))
    .slice(0, topK)
}

export function evaluateExternalBenchmarkRows(
  queries: ExternalBenchmarkQuery[],
  documents: ExternalBenchmarkDocument[],
  topK = 10
): ExternalBenchmarkRow[] {
  return queries.map((query) => {
    const topDocs = rankExternalDocuments(query.query, documents, topK)
    const firstMatchIndex = topDocs.findIndex((document) => query.expectedDocIds.includes(document.docId))

    return {
      id: query.id,
      query: query.query,
      expectedDocIds: query.expectedDocIds,
      firstMatchRank: firstMatchIndex === -1 ? null : firstMatchIndex + 1,
      topDocs,
      failureCategory: firstMatchIndex === -1 ? classifyExternalBenchmarkFailure(query.query, topDocs) : null
    }
  })
}

export function summarizeExternalBenchmarkRows(rows: ExternalBenchmarkRow[]): ExternalBenchmarkResult {
  let hitAt1 = 0
  let hitAt5 = 0
  let hitAt10 = 0
  let reciprocalRankTotal = 0
  const failureCategories = Object.fromEntries(
    FAILURE_CATEGORIES.map((category) => [category, 0])
  ) as Record<ExternalBenchmarkFailureCategory, number>

  for (const row of rows) {
    if (row.firstMatchRank === null) {
      failureCategories[row.failureCategory ?? 'zero_score'] += 1
      continue
    }

    reciprocalRankTotal += 1 / row.firstMatchRank

    if (row.firstMatchRank <= 1) {
      hitAt1 += 1
    }

    if (row.firstMatchRank <= 5) {
      hitAt5 += 1
    }

    if (row.firstMatchRank <= 10) {
      hitAt10 += 1
    }
  }

  return {
    total: rows.length,
    hitAt1: toRatio(hitAt1, rows.length),
    hitAt5: toRatio(hitAt5, rows.length),
    hitAt10: toRatio(hitAt10, rows.length),
    mrr: toRatio(reciprocalRankTotal, rows.length),
    failed: rows.filter((row) => row.firstMatchRank === null).length,
    failureCategories
  }
}

export function createExternalBenchmarkInputHash(input: {
  queries: ExternalBenchmarkQuery[]
  documents: ExternalBenchmarkDocument[]
}): string {
  const hash = createHash('sha256')
  const queries = input.queries
    .map((query) => ({
      id: query.id,
      query: query.query,
      expectedDocIds: [...query.expectedDocIds].sort()
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
  const documents = input.documents
    .map((document) => ({
      docId: document.docId,
      title: document.title,
      text: document.text
    }))
    .sort((left, right) => left.docId.localeCompare(right.docId))

  hash.update(JSON.stringify({ queries, documents }))
  return hash.digest('hex')
}

export function formatExternalBenchmarkMarkdown(payload: ExternalBenchmarkPayload): string {
  const failedRows = payload.rows.filter((row) => row.firstMatchRank === null)
  const failedLines = failedRows.length === 0
    ? ['- None.']
    : failedRows.map((row) => {
        return `- ${row.id}: ${row.failureCategory ?? 'unknown'} / expected=${row.expectedDocIds.join(', ')} / top=${row.topDocs.map((doc) => doc.docId).join(', ') || '-'}`
      })

  const rowLines = payload.rows.map((row) => {
    const topDocs = row.topDocs
      .slice(0, 5)
      .map((document) => `${document.docId} (${document.score.toFixed(3)})`)
      .join('<br>')

    return `| ${row.id} | ${row.firstMatchRank ?? '-'} | ${row.failureCategory ?? '-'} | ${row.expectedDocIds.join(', ')} | ${topDocs || '-'} | ${row.query} |`
  })

  return `# 外部benchmark subset評価記録

## 日本語要約

この記録は、Mr. TyDi Japanese dev splitから抽出した小規模subsetに対する、local lexical baselineの特定時点ログです。

- 確認したこと: 外部dataset由来のquery/gold doc idに対して、単純なlocal lexical rankerがcandidate subset内でgold documentを上位に返せるか
- 結果: hit@1 ${payload.result.hitAt1.toFixed(3)} / hit@5 ${payload.result.hitAt5.toFixed(3)} / hit@10 ${payload.result.hitAt10.toFixed(3)} / MRR ${payload.result.mrr.toFixed(3)}
- 読み方: scaffold-fixture co-design外の外部queryで検索評価を行うための小規模baselineです。低スコアも含めて失敗分類を残します。
- この記録に含めない範囲: 公式Mr. TyDi full-corpus score、Workers AI + Vectorizeのprovider品質、Claude回答品質、本番RAG品質

詳細なmetric名、dataset ID、doc id、raw JSONは、証拠性と再現性を保つため英語表記のまま残しています。

生成日時: ${payload.generatedAt}
確認種別: ${payload.checkType}
結果: ${payload.result.failed === 0 ? 'pass' : 'recorded with failures'}

## 対象

- Dataset: ${payload.dataset.name}
- Language: ${payload.dataset.language}
- Split: ${payload.dataset.split}
- License: ${payload.dataset.license}
- Query limit: ${payload.dataset.queryLimit}
- Negative document limit: ${payload.dataset.negativeDocumentLimit}
- Candidate document count: ${payload.dataset.candidateDocumentCount}
- Input hash: \`${payload.dataset.inputHash}\`
- External calls: Hugging Face dataset files only
- Cloudflare / Workers AI / Vectorize / D1 calls: none
- Claude calls: none

## source URLs

${payload.dataset.sourceUrls.map((url) => `- ${url}`).join('\n')}

## metrics

| Metric | Value |
|---|---:|
| total | ${payload.result.total} |
| hit@1 | ${payload.result.hitAt1.toFixed(3)} |
| hit@5 | ${payload.result.hitAt5.toFixed(3)} |
| hit@10 | ${payload.result.hitAt10.toFixed(3)} |
| MRR | ${payload.result.mrr.toFixed(3)} |
| failed | ${payload.result.failed} |

## 失敗分類

| Category | Count |
|---|---:|
${FAILURE_CATEGORIES.map((category) => `| ${category} | ${payload.result.failureCategories[category]} |`).join('\n')}

## 失敗case

${failedLines.join('\n')}

## query別結果

| ID | First expected rank | Failure category | Expected docs | Top docs | Query |
|---|---:|---|---|---|---|
${rowLines.join('\n')}

## この記録に含めない範囲

- 公式のMr. TyDi full-corpus benchmark scoreではない。
- Workers AI、Vectorize、D1、provider-mode \`/api/search\` は評価しない。
- Claude回答品質は評価しない。
- 25-fixture provider retrieval評価の置き換えではなく、別のexternal-subset baselineとして扱う。
- candidate documentsはexternal gold documentsとsampled non-gold documentsから作った小規模subsetであり、日本語corpus全体ではない。

## raw result data

Raw JSONは \`external-benchmark-eval-${payload.generatedAt.slice(0, 10)}.json\` として同じdirectoryに保存する。
`
}

export function extractExternalBenchmarkTerms(query: string): string[] {
  const normalized = normalizeJapaneseText(query)
  const terms = new Set<string>()

  normalized
    .split(/[\s、。,.!?！？/・「」『』（）()[\]【】"'“”]+/)
    .filter((token) => token.length >= 2)
    .forEach((token) => terms.add(token))

  for (const gram of createCharacterNGrams(normalized, 2)) {
    terms.add(gram)
  }

  for (const gram of createCharacterNGrams(normalized, 3)) {
    terms.add(gram)
  }

  return [...terms]
}

export function normalizeJapaneseText(input: string): string {
  return input.normalize('NFKC').toLocaleLowerCase('ja-JP')
}

function scoreExternalBenchmarkDocument(
  query: string,
  terms: string[],
  document: ExternalBenchmarkDocument
): number {
  const title = normalizeJapaneseText(document.title)
  const text = normalizeJapaneseText(document.text)
  const normalizedQuery = normalizeJapaneseText(query)
  let score = 0

  for (const term of terms) {
    if (title.includes(term)) {
      score += term.length >= 3 ? 3 : 1.5
    }

    if (text.includes(term)) {
      score += term.length >= 3 ? 1.25 : 0.5
    }
  }

  if (title.includes(normalizedQuery)) {
    score += 8
  }

  if (text.includes(normalizedQuery)) {
    score += 4
  }

  return Number(score.toFixed(3))
}

function classifyExternalBenchmarkFailure(query: string, topDocs: ExternalBenchmarkRankedDocument[]): ExternalBenchmarkFailureCategory {
  if (topDocs.length === 0) {
    return 'zero_score'
  }

  const normalizedQuery = normalizeJapaneseText(query)

  if (normalizedQuery.length > 40) {
    return 'long_query_drift'
  }

  return 'domain_mismatch'
}

function createCharacterNGrams(input: string, size: number): string[] {
  const compact = input.replace(/[\s、。,.!?！？/・「」『』（）()[\]【】"'“”]+/g, '')
  const grams: string[] = []

  for (let index = 0; index <= compact.length - size; index += 1) {
    grams.push(compact.slice(index, index + size))
  }

  return grams
}

function toRatio(count: number, total: number): number {
  if (total === 0) {
    return 0
  }

  return Number((count / total).toFixed(3))
}
