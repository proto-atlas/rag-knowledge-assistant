import { createStableContentHash } from '../../src/rag/hash'

describe('createStableContentHash', () => {
  it('同じ文字列を渡すと同じhashになる', () => {
    expect(createStableContentHash('同じ内容')).toBe('a8f4c927')
  })

  it('異なる文字列を渡すと異なるhashになる', () => {
    expect(createStableContentHash('同じ内容')).not.toBe(createStableContentHash('別の内容'))
  })
})
