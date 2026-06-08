import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { runRetrievalEval, retrievalEvalFixtures } = require('../.tmp/evidence-build/rag/retrieval-eval.js')
const { createRetrievalEvalJson, formatRetrievalEvalMarkdown } = require('../.tmp/evidence-build/rag/evidence-format.js')

const generatedAt = new Date().toISOString()
const date = generatedAt.slice(0, 10)
const payload = {
  generatedAt,
  result: runRetrievalEval(),
  fixtures: retrievalEvalFixtures
}

const evidenceDir = join(root, 'docs', 'evidence')
const markdownPath = join(evidenceDir, `retrieval-eval-${date}.md`)
const jsonPath = join(evidenceDir, `retrieval-eval-${date}.json`)

await mkdir(dirname(markdownPath), { recursive: true })
await writeFile(markdownPath, formatRetrievalEvalMarkdown(payload), 'utf8')
await writeFile(jsonPath, createRetrievalEvalJson(payload), 'utf8')

console.log(`wrote ${markdownPath}`)
console.log(`wrote ${jsonPath}`)
