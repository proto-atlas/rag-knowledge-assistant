import { fixtureDocuments } from '../../src/shared/fixture-documents'
import { createChunks, estimateTokenCount, splitContentIntoChunks } from '../../src/rag/chunker'
import { parseMarkdownDocument } from '../../src/rag/markdown'

const document = fixtureDocuments[0]

describe('createChunks', () => {
  it('Markdown解析結果を渡すと安定したchunk idを付ける', () => {
    const parsed = parseMarkdownDocument(`# ${document.title}

## 目的

これは最初の本文です。

## 手順

これは二番目の本文です。
`)

    const chunks = createChunks(document, parsed)

    expect(chunks.map((chunk) => chunk.chunkId)).toEqual([
      'remote-work-policy__s1__c1',
      'remote-work-policy__s2__c1'
    ])
  })

  it('長い本文を渡すとmaxChunkChars以下に分割する', () => {
    const content = `${'あ'.repeat(300)}。${'い'.repeat(300)}。${'う'.repeat(300)}。`

    const chunks = splitContentIntoChunks(content, { minChunkChars: 250, maxChunkChars: 650 })

    expect(chunks).toHaveLength(2)
    expect(chunks[0].length).toBeLessThanOrEqual(650)
    expect(chunks[1].length).toBeLessThanOrEqual(650)
  })

  it('不正なchunk設定を渡すと例外を投げる', () => {
    expect(() => splitContentIntoChunks('本文です。', { minChunkChars: 10, maxChunkChars: 5 })).toThrow(
      'Invalid chunking options'
    )
  })
})

describe('estimateTokenCount', () => {
  it('日本語本文を渡すと文字数と同じ保守的な見積もりを返す', () => {
    expect(estimateTokenCount('日本語の本文')).toBe(6)
  })
})
