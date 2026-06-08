import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createGunzip } from 'node:zlib'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const cacheDir = join(root, '.tmp', 'external-benchmark', 'mrtydi-v1.1-japanese')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const {
  createExternalBenchmarkInputHash,
  evaluateExternalBenchmarkRows,
  formatExternalBenchmarkMarkdown,
  summarizeExternalBenchmarkRows
} = require('../.tmp/evidence-build/rag/external-benchmark.js')

const DATASET_NAME = 'castorini/mr-tydi japanese dev subset'
const DATASET_LICENSE = 'Apache-2.0'
const QUERY_LIMIT = parsePositiveInteger(process.env.RAG_EXTERNAL_BENCHMARK_QUERY_LIMIT, 50)
const NEGATIVE_DOCUMENT_LIMIT = parsePositiveInteger(process.env.RAG_EXTERNAL_BENCHMARK_NEGATIVE_DOCUMENT_LIMIT, 250)
const SOURCE_URLS = {
  dataset: 'https://huggingface.co/datasets/castorini/mr-tydi',
  corpusDataset: 'https://huggingface.co/datasets/castorini/mr-tydi-corpus',
  devFile: 'https://huggingface.co/datasets/castorini/mr-tydi/resolve/main/mrtydi-v1.1-japanese/dev.jsonl.gz',
  corpusFile: 'https://huggingface.co/datasets/castorini/mr-tydi-corpus/resolve/main/mrtydi-v1.1-japanese/corpus.jsonl.gz'
}

const generatedAt = new Date().toISOString()
const date = generatedAt.slice(0, 10)
const devPath = join(cacheDir, 'dev.jsonl.gz')
const corpusPath = join(cacheDir, 'corpus.jsonl.gz')

await mkdir(cacheDir, { recursive: true })
await downloadIfMissing(SOURCE_URLS.devFile, devPath)
await downloadIfMissing(SOURCE_URLS.corpusFile, corpusPath)

const queries = await readQueries(devPath, QUERY_LIMIT)
const expectedDocIds = new Set(queries.flatMap((query) => query.expectedDocIds))
const documents = await readCandidateDocuments(corpusPath, expectedDocIds, NEGATIVE_DOCUMENT_LIMIT)
const foundExpectedDocIds = new Set(documents.filter((document) => expectedDocIds.has(document.docId)).map((document) => document.docId))
const missingExpectedDocIds = [...expectedDocIds].filter((docId) => !foundExpectedDocIds.has(docId))

if (missingExpectedDocIds.length > 0) {
  throw new Error(`external benchmark corpus scan missed expected doc ids: ${missingExpectedDocIds.slice(0, 10).join(', ')}`)
}

const rows = evaluateExternalBenchmarkRows(queries, documents, 10)
const payload = {
  generatedAt,
  checkType: 'external-benchmark-subset-eval',
  dataset: {
    name: DATASET_NAME,
    language: 'japanese',
    split: 'dev',
    license: DATASET_LICENSE,
    sourceUrls: Object.values(SOURCE_URLS),
    queryLimit: queries.length,
    negativeDocumentLimit: NEGATIVE_DOCUMENT_LIMIT,
    candidateDocumentCount: documents.length,
    inputHash: createExternalBenchmarkInputHash({ queries, documents })
  },
  result: summarizeExternalBenchmarkRows(rows),
  rows
}

const evidenceDir = join(root, 'docs', 'evidence')
const markdownPath = join(evidenceDir, `external-benchmark-eval-${date}.md`)
const jsonPath = join(evidenceDir, `external-benchmark-eval-${date}.json`)

await mkdir(dirname(markdownPath), { recursive: true })
await writeFile(markdownPath, formatExternalBenchmarkMarkdown(payload), 'utf8')
await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`wrote ${markdownPath}`)
console.log(`wrote ${jsonPath}`)

async function downloadIfMissing(url, outputPath) {
  const existing = await getFileSize(outputPath)

  if (existing > 0) {
    console.log(`using cached ${outputPath}`)
    return
  }

  console.log(`downloading ${url}`)
  const response = await fetch(url)

  if (!response.ok || response.body === null) {
    throw new Error(`failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  const tempPath = `${outputPath}.tmp`

  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(tempPath))
    await rename(tempPath, outputPath)
  } catch (error) {
    await unlinkIfExists(tempPath)
    throw error
  }
}

async function readQueries(filePath, limit) {
  const rows = []

  for await (const row of readGzipJsonLines(filePath)) {
    const parsed = parseDevRow(row)

    if (parsed !== null) {
      rows.push(parsed)
    }

    if (rows.length >= limit) {
      break
    }
  }

  if (rows.length < 50) {
    throw new Error(`external benchmark needs at least 50 query rows; found ${rows.length}`)
  }

  return rows
}

async function readCandidateDocuments(filePath, expectedDocIds, negativeLimit) {
  const documents = []
  const foundExpectedDocIds = new Set()
  let negativeCount = 0

  for await (const row of readGzipJsonLines(filePath)) {
    const document = parseCorpusRow(row)

    if (document === null) {
      continue
    }

    if (expectedDocIds.has(document.docId)) {
      documents.push(document)
      foundExpectedDocIds.add(document.docId)
    } else if (negativeCount < negativeLimit) {
      documents.push(document)
      negativeCount += 1
    }

    if (foundExpectedDocIds.size === expectedDocIds.size && negativeCount >= negativeLimit) {
      break
    }
  }

  return documents
}

async function* readGzipJsonLines(filePath) {
  const input = createReadStream(filePath).pipe(createGunzip())
  const lines = createInterface({
    input,
    crlfDelay: Number.POSITIVE_INFINITY
  })
  let buffered = ''

  for await (const line of lines) {
    if (line.trim().length === 0 && buffered.length === 0) {
      continue
    }

    buffered = buffered.length === 0 ? line : `${buffered}${isInsideJsonString(buffered) ? '\\n' : '\n'}${line}`

    try {
      yield JSON.parse(buffered)
      buffered = ''
    } catch (error) {
      if (isRecoverableJsonBuffer(error)) {
        continue
      }

      throw error
    }
  }

  if (buffered.length > 0) {
    yield JSON.parse(buffered)
  }
}

function parseDevRow(row) {
  if (!isRecord(row) || typeof row.query_id !== 'string' || typeof row.query !== 'string') {
    return null
  }

  const docIds = extractPositiveDocIds(row)

  if (docIds.length === 0) {
    return null
  }

  return {
    id: row.query_id,
    query: row.query,
    expectedDocIds: docIds
  }
}

function extractPositiveDocIds(row) {
  if (!Array.isArray(row.positive_passages)) {
    return []
  }

  return row.positive_passages
    .map((passage) => {
      if (!isRecord(passage) || typeof passage.docid !== 'string') {
        return null
      }

      return passage.docid
    })
    .filter((docId) => docId !== null)
}

function parseCorpusRow(row) {
  if (!isRecord(row) || typeof row.docid !== 'string') {
    return null
  }

  const title = typeof row.title === 'string' ? row.title : ''
  const text = typeof row.text === 'string' ? row.text : ''

  if (title.trim().length === 0 && text.trim().length === 0) {
    return null
  }

  return {
    docId: row.docid,
    title,
    text
  }
}

async function getFileSize(filePath) {
  try {
    return (await stat(filePath)).size
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') {
      return 0
    }

    throw error
  }
}

async function unlinkIfExists(filePath) {
  try {
    await unlink(filePath)
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') {
      return
    }

    throw error
  }
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value.trim().length === 0) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`expected positive integer, got ${value}`)
  }

  return parsed
}

function isRecoverableJsonBuffer(error) {
  if (!(error instanceof SyntaxError)) {
    return false
  }

  return /Unterminated string|Unexpected end of JSON input|Expected ',' or '}'/.test(error.message)
}

function isInsideJsonString(value) {
  let inString = false
  let escaped = false

  for (const character of value) {
    if (escaped) {
      escaped = false
      continue
    }

    if (character === '\\') {
      escaped = true
      continue
    }

    if (character === '"') {
      inString = !inString
    }
  }

  return inString
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
