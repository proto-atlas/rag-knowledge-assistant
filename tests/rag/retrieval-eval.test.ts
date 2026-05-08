import { retrievalEvalFixtures, runRetrievalEval } from '../../src/rag/retrieval-eval'

describe('runRetrievalEval', () => {
  it('fixture内訳がanswerable 20件とno-answer 5件になる', () => {
    expect(retrievalEvalFixtures.filter((fixture) => fixture.shouldAnswer)).toHaveLength(20)
    expect(retrievalEvalFixtures.filter((fixture) => !fixture.shouldAnswer)).toHaveLength(5)
  })

  it('初期acceptance targetを満たす', () => {
    const result = runRetrievalEval()

    expect(result.hitAt5).toBeGreaterThanOrEqual(0.8)
    expect(result.noAnswerAccuracy).toBeGreaterThanOrEqual(0.8)
    expect(result.failedCases).toEqual([])
  })

  it('hit@1とMRRを計算する', () => {
    const result = runRetrievalEval()

    expect(result.hitAt1).toBeGreaterThanOrEqual(0.8)
    expect(result.mrr).toBeGreaterThanOrEqual(0.8)
  })
})
