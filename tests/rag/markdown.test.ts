import { parseMarkdownDocument } from '../../src/rag/markdown'

describe('parseMarkdownDocument', () => {
  it('H1とH2を含むMarkdownを渡すとtitleとsectionを抽出する', () => {
    const parsed = parseMarkdownDocument(`# テスト文書

## 目的

本文です。

## 手順

- 一つ目
- 二つ目
`)

    expect(parsed.title).toBe('テスト文書')
    expect(parsed.sections).toEqual([
      { headingPath: ['目的'], content: '本文です。' },
      { headingPath: ['手順'], content: '一つ目 二つ目' }
    ])
  })

  it('H1がないMarkdownを渡すと例外を投げる', () => {
    expect(() => parseMarkdownDocument('## 見出し\n\n本文です。')).toThrow('Markdown document must start with an H1 title')
  })

  it('本文がないMarkdownを渡すと例外を投げる', () => {
    expect(() => parseMarkdownDocument('# 空の文書\n\n## 見出し')).toThrow(
      'Markdown document must include at least one non-empty section'
    )
  })
})
