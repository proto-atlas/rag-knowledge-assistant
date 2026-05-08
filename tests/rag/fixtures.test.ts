import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fixtureDocuments } from '../../src/shared/fixture-documents'
import { createChunks } from '../../src/rag/chunker'
import { parseMarkdownDocument } from '../../src/rag/markdown'

const fixtureDirectory = join(process.cwd(), 'src', 'fixtures', 'documents')
const forbiddenSecretPatterns = [/sk-ant-[A-Za-z0-9_-]{10,}/, /api[_-]?key\s*[:=]/i, /secret\s*[:=]/i, /password\s*[:=]/i, /token\s*[:=]/i]

describe('fixture documents', () => {
  it('catalogの全slugに対応するMarkdownが存在する', () => {
    const titles = fixtureDocuments.map((document) => {
      const markdown = readFixture(document.slug)
      return parseMarkdownDocument(markdown).title
    })

    expect(titles).toEqual([
      'リモート勤務規程',
      '経費精算ガイド',
      'セキュリティハンドブック',
      'インシデント対応手順',
      'オンボーディングガイド',
      '製品FAQ',
      'サポートエスカレーション基準',
      'リリース手順'
    ])
  })

  it('全fixtureからchunkを生成できる', () => {
    const chunkCount = fixtureDocuments.reduce((total, document) => {
      const parsed = parseMarkdownDocument(readFixture(document.slug))
      return total + createChunks(document, parsed).length
    }, 0)

    expect(chunkCount).toBe(24)
  })

  it('fixture本文にsecretらしき文字列を含めない', () => {
    const combined = fixtureDocuments.map((document) => readFixture(document.slug)).join('\n')

    expect(forbiddenSecretPatterns.some((pattern) => pattern.test(combined))).toBe(false)
  })
})

function readFixture(slug: string): string {
  return readFileSync(join(fixtureDirectory, `${slug}.md`), 'utf8')
}
