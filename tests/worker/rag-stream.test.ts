import { describe, expect, it } from 'vitest'
import {
  createSseResponse,
  createMockRagStreamEvents,
  encodeSseEvent,
  findInvalidSourceIds
} from '../../src/worker/rag-stream'
import type { SearchResponse } from '../../src/rag/search-types'

const searchResponse: SearchResponse = {
  query: 'リモート勤務の申請期限は？',
  topK: 3,
  indexVersion: 'fixture-corpus-v1',
  noAnswerRecommended: false,
  results: [
    {
      sourceId: '1',
      chunkId: 'remote-work-policy__s1__c1',
      documentSlug: 'remote-work-policy',
      documentTitle: 'リモート勤務規程',
      headingPath: ['対象と申請'],
      excerpt: 'リモート勤務は、開始希望日の前営業日十八時までに勤務予定を提出します。',
      category: 'policy',
      tags: ['policy'],
      score: 3
    }
  ]
}

describe('createMockRagStreamEvents', () => {
  it('根拠候補がある場合はsourcesとanswer_deltaとdoneを返す', () => {
    const events = createMockRagStreamEvents(searchResponse)

    expect(events[0]).toEqual({
      type: 'retrieval_start',
      query: 'リモート勤務の申請期限は？'
    })
    expect(events[1]).toMatchObject({
      type: 'sources',
      response: {
        results: [
          {
            sourceId: '1'
          }
        ]
      }
    })
    expect(events.some((event) => event.type === 'generation_start')).toBe(true)
    expect(events.some((event) => event.type === 'answer_delta')).toBe(true)
    expect(events.at(-1)).toEqual({ type: 'done' })
  })

  it('noAnswerRecommendedなら回答deltaを出さずno_answerを返す', () => {
    const events = createMockRagStreamEvents({
      ...searchResponse,
      noAnswerRecommended: true,
      results: []
    })

    expect(events).toEqual([
      {
        type: 'retrieval_start',
        query: 'リモート勤務の申請期限は？'
      },
      {
        type: 'sources',
        response: {
          ...searchResponse,
          noAnswerRecommended: true,
          results: []
        }
      },
      {
        type: 'no_answer',
        message: '根拠候補が弱いため回答できません。'
      },
      {
        type: 'done'
      }
    ])
  })
})

describe('findInvalidSourceIds', () => {
  it('存在しないsource idだけを返す', () => {
    expect(findInvalidSourceIds(['1', '99'], searchResponse)).toEqual(['99'])
  })
})

describe('encodeSseEvent', () => {
  it('event名とJSON dataをSSE形式へ変換する', () => {
    expect(encodeSseEvent({
      type: 'answer_delta',
      text: '回答'
    })).toBe('event: answer_delta\ndata: {"type":"answer_delta","text":"回答"}\n\n')
  })
})

describe('createSseResponse', () => {
  it('AbortSignalが中断済みならeventを出さない', async () => {
    const controller = new AbortController()
    controller.abort()
    const response = createSseResponse([
      {
        type: 'answer_delta',
        text: '回答'
      }
    ], controller.signal)

    await expect(response.text()).resolves.toBe('')
  })
})
