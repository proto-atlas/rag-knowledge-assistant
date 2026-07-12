import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { expect, test } from 'vitest'

const scriptPath = resolve('scripts/decide-e2e.mjs')

function runDecision(base: string, changedPath?: string) {
  const directory = mkdtempSync(join(tmpdir(), 'rag-e2e-decision-'))
  const outputPath = join(directory, 'output.txt')
  execFileSync('git', ['init'], { cwd: directory })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: directory })
  execFileSync('git', ['config', 'user.name', 'テスト'], { cwd: directory })
  writeFileSync(join(directory, 'README.md'), '初期\n')
  execFileSync('git', ['add', '.'], { cwd: directory })
  execFileSync('git', ['commit', '-m', '初期'], { cwd: directory })
  const baseSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: directory,
    encoding: 'utf8',
  }).trim()
  if (changedPath !== undefined) {
    writeFileSync(join(directory, changedPath), '変更\n')
    execFileSync('git', ['add', '.'], { cwd: directory })
    execFileSync('git', ['commit', '-m', '変更'], { cwd: directory })
  }
  execFileSync('node', [scriptPath], {
    cwd: directory,
    env: {
      ...process.env,
      BASE_SHA: base === 'existing' ? baseSha : base,
      GITHUB_SHA: 'HEAD',
      GITHUB_OUTPUT: outputPath,
    },
  })
  return readFileSync(outputPath, 'utf8').trim()
}

test('比較元コミットを参照できない場合はE2Eを実行する', () => {
  expect(runDecision('1111111111111111111111111111111111111111')).toBe('run_e2e=true')
})

test('比較元がzero SHAの場合はE2Eを実行する', () => {
  expect(runDecision('0000000000000000000000000000000000000000')).toBe('run_e2e=true')
})

test('文書だけを変更した場合はE2Eを省略する', () => {
  expect(runDecision('existing', 'README.md')).toBe('run_e2e=false')
})

test('コードを変更した場合はE2Eを実行する', () => {
  expect(runDecision('existing', 'app.ts')).toBe('run_e2e=true')
})
