import { initialPublicStatus } from '../../src/shared/public-status'

describe('initialPublicStatus', () => {
  it('架空fixtureのdocument数とchunk数を公開statusへ出す', () => {
    expect(initialPublicStatus).toEqual({
      documentCount: 8,
      chunkCount: 24,
      indexVersion: 'fixture-corpus-v1',
      lastIndexedAt: null
    })
  })
})
