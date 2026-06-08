import { createRetrievalEvalJson, formatRetrievalEvalMarkdown } from '../../src/rag/evidence-format'
import type { RetrievalEvidencePayload } from '../../src/rag/evidence-format'

const payload: RetrievalEvidencePayload = {
  generatedAt: '2026-04-30T00:00:00.000Z',
  result: {
    total: 2,
    answerableTotal: 1,
    noAnswerTotal: 1,
    hitAt1: 1,
    hitAt3: 1,
    hitAt5: 1,
    mrr: 1,
    noAnswerAccuracy: 1,
    failedCases: []
  },
  fixtures: [
    {
      id: 'ret-001',
      question: 'リモート勤務はいつまでに申請しますか？',
      expectedChunkIds: ['remote-work-policy__s1__c1'],
      shouldAnswer: true
    },
    {
      id: 'no-001',
      question: '来週の東京の天気は？',
      expectedChunkIds: [],
      shouldAnswer: false
    }
  ]
}

describe('formatRetrievalEvalMarkdown', () => {
  it('結果をMarkdown tableとして出力する', () => {
    const markdown = formatRetrievalEvalMarkdown(payload)

    expect(markdown).toContain('| hit@5 | >= 0.800 | 1.000 |')
    expect(markdown).toContain('| Answerable questions | 1 |')
    expect(markdown).toContain('外部呼び出し: なし')
  })
})

describe('createRetrievalEvalJson', () => {
  it('payloadを末尾改行付きJSONにする', () => {
    expect(createRetrievalEvalJson(payload).endsWith('\n')).toBe(true)
  })
})
