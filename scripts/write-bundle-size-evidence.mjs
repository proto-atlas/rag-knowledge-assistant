import { brotliCompressSync, gzipSync } from 'node:zlib'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const buildDir = join(root, '.tmp', 'evidence-build')
const require = createRequire(import.meta.url)

await writeFile(join(buildDir, 'package.json'), '{"type":"commonjs"}\n')

const { formatBytes } = require('../.tmp/evidence-build/rag/evidence-metrics.js')

const generatedAt = new Date().toISOString()
const date = generatedAt.slice(0, 10)
const distDir = join(root, 'dist', 'client')
const evidenceDir = join(root, 'docs', 'evidence')
const markdownPath = join(evidenceDir, `bundle-size-${date}.md`)
const jsonPath = join(evidenceDir, `bundle-size-${date}.json`)
const assetPaths = await collectAssetPaths(distDir)
const assets = []

for (const assetPath of assetPaths) {
  const bytes = await readFile(assetPath)
  assets.push({
    path: relative(distDir, assetPath).replaceAll('\\', '/'),
    extension: extname(assetPath),
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
    brotliBytes: brotliCompressSync(bytes).length
  })
}

assets.sort((left, right) => left.path.localeCompare(right.path))

const totals = assets.reduce((sum, asset) => {
  return {
    rawBytes: sum.rawBytes + asset.rawBytes,
    gzipBytes: sum.gzipBytes + asset.gzipBytes,
    brotliBytes: sum.brotliBytes + asset.brotliBytes
  }
}, { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 })

const payload = {
  generatedAt,
  checkType: 'bundle-size',
  scope: 'local production build output',
  totals,
  assets
}

await mkdir(dirname(markdownPath), { recursive: true })
await writeFile(markdownPath, formatMarkdown(payload), 'utf8')
await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

console.log(`wrote ${markdownPath}`)
console.log(`wrote ${jsonPath}`)

async function collectAssetPaths(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = []

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name)

    if (entry.isDirectory()) {
      paths.push(...await collectAssetPaths(absolutePath))
      continue
    }

    paths.push(absolutePath)
  }

  return paths
}

function formatMarkdown(payload) {
  const rows = payload.assets.map((asset) => {
    return `| \`${asset.path}\` | ${formatBytes(asset.rawBytes)} | ${formatBytes(asset.gzipBytes)} | ${formatBytes(asset.brotliBytes)} |`
  })

  return `# Bundle Size Evidence

## 日本語要約

このevidenceは、local production build outputのbundle sizeを記録したpoint-in-timeログです。

- 確認したこと: Vite build後のHTML / CSS / JavaScript asset size
- 結果: total gzip ${formatBytes(payload.totals.gzipBytes)}、total brotli ${formatBytes(payload.totals.brotliBytes)}
- 読み方: build artifact sizeの記録であり、Core Web Vitalsやruntime性能の証明ではありません
- このログで主張しないこと: field performance、Cloudflare edge latency、large corpus / live provider mode下の性能

詳細なasset名、gzip / brotli表記、byte数は、証拠性と再現性を保つため原文のまま残しています。

Generated at: ${payload.generatedAt}
Check type: ${payload.checkType}
Result: pass

This evidence records the local production build output size. It is a point-in-time bundle measurement, not a Core Web Vitals or runtime performance claim.

## Scope

- Command path: local production build output in \`dist/client\`
- Includes HTML, CSS, and JavaScript assets emitted by Vite
- Does not run Lighthouse
- Does not measure real-user Core Web Vitals
- Does not measure Cloudflare edge latency

## Summary

| Total raw | Total gzip | Total brotli |
|---:|---:|---:|
| ${formatBytes(payload.totals.rawBytes)} | ${formatBytes(payload.totals.gzipBytes)} | ${formatBytes(payload.totals.brotliBytes)} |

## Assets

| Asset | Raw | Gzip | Brotli |
|---|---:|---:|---:|
${rows.join('\n')}

## Not Claimed

- This does not claim Lighthouse Performance score.
- This does not claim INP, LCP, CLS, or field Core Web Vitals.
- This does not prove performance under large corpora or live provider mode.
`
}
