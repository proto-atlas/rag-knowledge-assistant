import { describe, expect, it } from 'vitest'
import { retrievalEvalSummary } from '../../src/shared/retrieval-eval-summary'

describe('retrievalEvalSummary', () => {
  it('公開トップに出す評価サマリーがPhase 4 evidenceの主要数値と一致する', () => {
    expect(retrievalEvalSummary).toEqual({
      generatedAt: '2026-04-30T10:03:24.505Z',
      scope: 'mock lexical retrieval only',
      totalFixtures: 25,
      answerableFixtures: 20,
      noAnswerFixtures: 5,
      failedCases: 0,
      metrics: [
        {
          label: 'hit@1',
          value: '0.900',
          note: '期待chunkが1位に入った割合'
        },
        {
          label: 'hit@5',
          value: '1.000',
          note: '期待chunkがtop 5に入った割合'
        },
        {
          label: 'MRR',
          value: '0.950',
          note: '期待chunk順位の逆数平均'
        },
        {
          label: 'no-answer accuracy',
          value: '1.000',
          note: '回答しないfixtureを回答しないと判断した割合'
        }
      ]
    })
  })
})
