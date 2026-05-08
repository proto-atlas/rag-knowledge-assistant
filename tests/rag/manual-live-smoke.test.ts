import { describe, expect, it } from 'vitest'
import {
  createManualLiveSmokeCases,
  createManualLiveSmokeRequestBody,
  evaluateManualLiveSmokeCase,
  readRagSsePayloads,
  summarizeRagSsePayloads
} from '../../src/rag/manual-live-smoke'

describe('createManualLiveSmokeCases', () => {
  it('既知回答とno-answerの2ケースだけを返す', () => {
    expect(createManualLiveSmokeCases()).toEqual([
      {
        id: 'known-answer',
        question: 'リモート勤務の申請期限は？',
        topK: 5
      },
      {
        id: 'no-answer',
        question: '天気予報を教えて',
        topK: 5
      }
    ])
  })
})

describe('createManualLiveSmokeRequestBody', () => {
  it('access keyをbodyに含めず質問とtopKだけを返す', () => {
    const body = createManualLiveSmokeRequestBody({
      id: 'known-answer',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    })

    expect(body).toEqual({
      question: 'リモート勤務の申請期限は？',
      topK: 5
    })
    expect(JSON.stringify(body)).not.toContain('test-access-key')
  })
})

describe('readRagSsePayloads', () => {
  it('分割されたSSEからpayloadを読む', async () => {
    const payloads = await readRagSsePayloads(createTextStream([
      'event: retrieval_start\n',
      'data: {"type":"retrieval_start","query":"リモート',
      '勤務"}\n\n',
      'event: done\n',
      'data: {"type":"done"}\n\n'
    ]))

    expect(payloads).toEqual([
      {
        type: 'retrieval_start',
        query: 'リモート勤務'
      },
      {
        type: 'done'
      }
    ])
  })
})

describe('summarizeRagSsePayloads', () => {
  it('event種別とsource idとsecret漏れをsummaryにする', () => {
    const summary = summarizeRagSsePayloads([
      {
        type: 'sources',
        response: {
          results: [
            {
              sourceId: '1'
            }
          ]
        }
      },
      {
        type: 'answer_delta',
        text: '前営業日十八時までです。[1]'
      },
      {
        type: 'done'
      }
    ], ['test-access-key'])

    expect(summary).toEqual({
      eventTypes: ['sources', 'answer_delta', 'done'],
      answerDeltaCount: 1,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })
  })

  it('secret-like valueがpayloadに含まれたらleakedNeedlesへ記録する', () => {
    const summary = summarizeRagSsePayloads([
      {
        type: 'error',
        message: 'test-access-key'
      }
    ], ['test-access-key'])

    expect(summary.leakedNeedles).toEqual(['test-access-key'])
  })
})

describe('evaluateManualLiveSmokeCase', () => {
  it('known-answerでanswer_deltaとsourceがあれば成功にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'answer_delta', 'done'],
      answerDeltaCount: 1,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation).toEqual({
      ok: true,
      failedAssertions: []
    })
  })

  it('known-answerでprovider errorがあれば失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'error', 'done'],
      answerDeltaCount: 0,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: true,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('noProviderError')
  })

  it('known-answerでanswer_deltaがなければ失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'done'],
      answerDeltaCount: 0,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('knownAnswerHasAnswerDelta')
  })

  it('known-answerでsource validation failureがあれば失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'answer_delta', 'source_validation_failed', 'done'],
      answerDeltaCount: 1,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: true,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('knownAnswerNoSourceValidationFailed')
  })

  it('known-answerでsource idがなければ失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'answer_delta', 'done'],
      answerDeltaCount: 1,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: [],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('knownAnswerHasSourceIds')
  })

  it('no-answerでno_answerがありanswer_deltaがなければ成功にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'no-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'no_answer', 'done'],
      answerDeltaCount: 0,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: true,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation).toEqual({
      ok: true,
      failedAssertions: []
    })
  })

  it('no-answerでanswer_deltaがあれば失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'no-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'answer_delta', 'done'],
      answerDeltaCount: 1,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('noAnswerHasNoAnswerDelta')
  })

  it('no-answerでno_answerがなければ失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'no-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'done'],
      answerDeltaCount: 0,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('noAnswerEvent')
  })

  it('secret漏れがあればcase共通で失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['retrieval_start', 'sources', 'generation_start', 'answer_delta', 'done'],
      answerDeltaCount: 1,
      hasSources: true,
      hasDone: true,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: ['test-access-key']
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('noSecretLeak')
  })

  it('doneとsourcesがなければcase共通で失敗にする', () => {
    const evaluation = evaluateManualLiveSmokeCase({ id: 'known-answer' }, {
      eventTypes: ['generation_start', 'answer_delta'],
      answerDeltaCount: 1,
      hasSources: false,
      hasDone: false,
      hasNoAnswer: false,
      hasSourceValidationFailed: false,
      hasProviderError: false,
      sourceIds: ['1'],
      leakedNeedles: []
    })

    expect(evaluation.ok).toBe(false)
    expect(evaluation.failedAssertions).toContain('hasDone')
    expect(evaluation.failedAssertions).toContain('hasSources')
  })
})

function createTextStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }

      controller.close()
    }
  })
}
