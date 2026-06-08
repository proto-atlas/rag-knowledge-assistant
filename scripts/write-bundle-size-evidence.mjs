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

  return `# bundle size確認記録

## 日本語要約

この記録は、local production build outputのbundle sizeを記録した特定時点ログです。

- 確認したこと: Vite build後のHTML / CSS / JavaScript asset size
- 結果: total gzip ${formatBytes(payload.totals.gzipBytes)}、total brotli ${formatBytes(payload.totals.brotliBytes)}
- 読み方: build artifact sizeの記録であり、Core Web Vitalsやruntime性能の証明ではありません
- この記録に含めない範囲: field performance、Cloudflare edge latency、large corpus / live-provider mode下の性能

詳細なasset名、gzip / brotli表記、byte数は、証拠性と再現性を保つため原文のまま残しています。

生成日時: ${payload.generatedAt}
確認種別: ${payload.checkType}
結果: pass

この記録では、local production buildの出力サイズを残す。これは特定時点のbundle size計測であり、Core Web Vitalsやruntime performanceの主張ではない。

## 対象

- Command path: local production build output in \`dist/client\`
- Includes HTML, CSS, and JavaScript assets emitted by Vite
- Does not run Lighthouse
- Does not measure real-user Core Web Vitals
- Does not measure Cloudflare edge latency

## 集計

| Total raw | Total gzip | Total brotli |
|---:|---:|---:|
| ${formatBytes(payload.totals.rawBytes)} | ${formatBytes(payload.totals.gzipBytes)} | ${formatBytes(payload.totals.brotliBytes)} |

## アセット

| Asset | Raw | Gzip | Brotli |
|---|---:|---:|---:|
${rows.join('\n')}

## この記録に含めない範囲

- Lighthouse Performance scoreの主張ではない。
- INP、LCP、CLS、field Core Web Vitalsの主張ではない。
- large corpusやlive-provider mode下の性能を証明するものではない。
`
}
