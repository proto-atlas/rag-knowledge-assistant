import { describe, expect, it } from 'vitest'
import {
  AskApiError,
  parseSseFrame,
  readSseEvents,
  streamAskKnowledgeBase
} from '../../src/client/ask-api'
import type { SearchResponse } from '../../src/rag/search-types'

const searchResponse: SearchResponse = {
  query: 'リモート勤務の申請期限は？',
  topK: 5,
  indexVersion: 'fixture-corpus-v1',
  noAnswerRecommended: false,
  results: [
    {
      sourceId: '1',
      chunkId: 'remote-work-policy-001',
      documentSlug: 'remote-work-policy',
      documentTitle: 'リモート勤務規程',
      headingPath: ['申請期限'],
      excerpt: 'リモート勤務は前営業日の十八時までに申請します。',
      category: 'policy',
      tags: ['policy'],
      score: 6
    }
  ]
}

describe('parseSseFrame', () => {
  it('SSE frameをAskStreamEventへ変換する', () => {
    expect(parseSseFrame('event: answer_delta\ndata: {"type":"answer_delta","text":"回答"}')).toEqual({
      type: 'answer_delta',
      text: '回答'
    })
  })

  it('event名とpayload typeが違う場合はunexpected_responseを投げる', () => {
    expect(() => parseSseFrame('event: done\ndata: {"type":"answer_delta","text":"回答"}')).toThrow(AskApiError)
  })

  it('error eventを検証して返す', () => {
    expect(parseSseFrame('event: error\ndata: {"type":"error","code":"overloaded","message":"回答providerで一時的な問題が発生しました。"}')).toEqual({
      type: 'error',
      code: 'overloaded',
      message: '回答providerで一時的な問題が発生しました。'
    })
  })
})

describe('readSseEvents', () => {
  it('分割されたSSE streamから複数eventを読む', async () => {
    const events = []

    for await (const event of readSseEvents(createTextStream([
      'event: retrieval_start\ndata: {"type":"retrieval_start","query":"リモート',
      '勤務"}\n\n',
      'event: done\ndata: {"type":"done"}\n\n'
    ]))) {
      events.push(event)
    }

    expect(events).toEqual([
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

describe('streamAskKnowledgeBase', () => {
  it('SSE streamに成功したらeventを順番に返す', async () => {
    const fetchCalls: RequestInit[] = []
    const fetchImpl = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCalls.push(init ?? {})

      return new Response(createTextStream([
        `event: sources\ndata: ${JSON.stringify({ type: 'sources', response: searchResponse })}\n\n`,
        'event: answer_delta\ndata: {"type":"answer_delta","text":"回答"}\n\n',
        'event: done\ndata: {"type":"done"}\n\n'
      ]), {
        headers: {
          'content-type': 'text/event-stream'
        }
      })
    }

    const controller = new AbortController()
    const events = []

    for await (const event of streamAskKnowledgeBase({
      accessKey: 'test-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5,
      signal: controller.signal
    }, fetchImpl)) {
      events.push(event)
    }

    expect(fetchCalls[0]?.headers).toEqual({
      authorization: 'Bearer test-key',
      'content-type': 'application/json'
    })
    expect(events.at(0)).toMatchObject({ type: 'sources' })
    expect(events.at(1)).toEqual({
      type: 'answer_delta',
      text: '回答'
    })
    expect(events.at(2)).toEqual({ type: 'done' })
  })

  it('401が返ったらunauthorizedとして扱う', async () => {
    const fetchImpl = async (): Promise<Response> => {
      return Response.json({
        error: {
          code: 'unauthorized',
          message: '確認用キーが必要です。'
        }
      }, { status: 401 })
    }
    const controller = new AbortController()
    const events = streamAskKnowledgeBase({
      accessKey: 'wrong-key',
      question: 'リモート勤務の申請期限は？',
      topK: 5,
      signal: controller.signal
    }, fetchImpl)

    await expect(events.next()).rejects.toMatchObject({
      code: 'unauthorized',
      message: '確認用キーが必要です。',
      status: 401
    })
  })
})

function createTextStream(parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part))
      }

      controller.close()
    }
  })
}
