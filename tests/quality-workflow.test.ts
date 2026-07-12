import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from 'vitest'

test('比較元コミットを参照できない場合はE2Eを実行する', () => {
  const workflow = readFileSync(resolve('.github/workflows/quality.yml'), 'utf8')

  expect(workflow).toContain('if ! git cat-file -e "$base^{commit}" 2>/dev/null; then')
})
