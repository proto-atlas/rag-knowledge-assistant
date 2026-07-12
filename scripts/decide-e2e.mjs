import { appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ZERO_SHA = '0000000000000000000000000000000000000000'
const DOCUMENT_PATH = /^(README\.md|docs\/.*|LICENSE)$/

export function shouldRunE2E(base, head) {
  if (base === '' || base === ZERO_SHA) return true
  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { stdio: 'ignore' })
  } catch {
    return true
  }
  const changedFiles = execFileSync('git', ['diff', '--name-only', base, head], {
    encoding: 'utf8',
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
  if (changedFiles.length === 0) return true
  return changedFiles.some((path) => !DOCUMENT_PATH.test(path))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (outputPath === undefined) throw new Error('GITHUB_OUTPUTが設定されていません')
  const runE2E = shouldRunE2E(process.env.BASE_SHA ?? '', process.env.GITHUB_SHA ?? 'HEAD')
  appendFileSync(outputPath, `run_e2e=${runE2E}\n`)
}
