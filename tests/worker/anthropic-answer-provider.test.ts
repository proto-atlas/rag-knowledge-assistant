import { describe, expect, it } from 'vitest'
import {
  ANTHROPIC_MESSAGES_ENDPOINT,
  ANTHROPIC_VERSION,
  collectAnthropicStreamEvents,
  createAnthropicMessageRequestBody,
  readAnthropicSsePayloads,
  runAnthropicAnswerProvider,
  type FetchLike
} from '../../src/worker/anthropic-answer-provider'
import type { SearchResponse } from '../../src/rag/search-types'

const searchResponse: SearchResponse = {
  query: 'リモート勤務の申請期限は？',
  topK: 3,
  indexVersion: 'rag-bge-m3-v1',
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
      score: 0.82
    }
  ]
}

describe('createAnthropicMessageRequestBody', () => {
  it('Claudeへのrequest bodyにsource contextを入れ、secretを含めない', () => {
    const body = createAnthropicMessageRequestBody(searchResponse, {
      model: 'claude-test-model',
      maxTokens: 256
    })
    const serialized = JSON.stringify(body)

    expect(body.model).toBe('claude-test-model')
    expect(body.max_tokens).toBe(256)
    expect(body.stream).toBe(true)
    expect(body.messages[0]?.content).toContain('[1] リモート勤務規程 / 対象と申請')
    expect(body.system).toContain('回答は渡されたsourcesだけに基づけてください。')
    expect(serialized).not.toContain('test-api-key')
  })
})

describe('runAnthropicAnswerProvider', () => {
  it('正しいsource idを含むstreamならdomain eventへ正規化する', async () => {
    const requests: RequestInit[] = []
    const fetchImpl: FetchLike = async (_input, init) => {
      if (init) {
        requests.push(init)
      }

      return createStreamResponse([
        createTextDeltaFrame('前営業日十八時までに申請します。[1]'),
        createMessageStopFrame()
      ])
    }
    const events = await collectEvents(await runAnthropicAnswerProvider(searchResponse, {
      apiKey: 'test-api-key',
      model: 'claude-test-model',
      fetchImpl
    }))

    expect(events.map((event) => event.type)).toEqual([
      'retrieval_start',
      'sources',
      'generation_start',
      'answer_delta',
      'done'
    ])
    expect(events).toContainEqual({
      type: 'answer_delta',
      text: '前営業日十八時までに申請します。[1]'
    })
    expect(requests).toHaveLength(1)
    expect(requests[0]?.headers).toEqual({
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
      'x-api-key': 'test-api-key'
    })
    expect(requests[0]?.body).not.toContain('test-api-key')
  })

  it('source idがない回答は通常回答として表示しないeventにする', async () => {
    const events = await collectEvents(await runAnthropicAnswerProvider(searchResponse, {
      apiKey: 'test-api-key',
      model: 'claude-test-model',
      fetchImpl: async () => createStreamResponse([
        createTextDeltaFrame('前営業日十八時までに申請します。'),
        createMessageStopFrame()
      ])
    }))

    expect(events).toContainEqual({
      type: 'source_validation_failed',
      message: '回答の根拠を確認できなかったため表示できません。',
      invalidSourceIds: ['missing']
    })
    expect(events.some((event) => event.type === 'answer_delta')).toBe(true)
    expect(events.at(-2)).toEqual({
      type: 'source_validation_failed',
      message: '回答の根拠を確認できなかったため表示できません。',
      invalidSourceIds: ['missing']
    })
  })

  it('存在しないsource idの回答は通常回答として表示しないeventにする', async () => {
    const events = await collectEvents(await runAnthropicAnswerProvider(searchResponse, {
      apiKey: 'test-api-key',
      model: 'claude-test-model',
      fetchImpl: async () => createStreamResponse([
        createTextDeltaFrame('前営業日十八時までに申請します。[99]'),
        createMessageStopFrame()
      ])
    }))

    expect(events).toContainEqual({
      type: 'source_validation_failed',
      message: '回答の根拠を確認できなかったため表示できません。',
      invalidSourceIds: ['99']
    })
    expect(events.some((event) => event.type === 'answer_delta')).toBe(true)
    expect(events.at(-2)).toEqual({
      type: 'source_validation_failed',
      message: '回答の根拠を確認できなかったため表示できません。',
      invalidSourceIds: ['99']
    })
  })

  it('providerが529を返したらsanitized error eventを返す', async () => {
    const events = await collectEvents(await runAnthropicAnswerProvider(searchResponse, {
      apiKey: 'test-api-key',
      model: 'claude-test-model',
      fetchImpl: async () => new Response(null, {
        status: 529
      })
    }))

    expect(events).toContainEqual({
      type: 'error',
      code: 'overloaded',
      message: '回答providerで一時的な問題が発生しました。'
    })
    expect(JSON.stringify(events)).not.toContain('test-api-key')
  })

  it('no-answer推奨ならClaude APIを呼ばない', async () => {
    let called = false
    const events = await collectEvents(await runAnthropicAnswerProvider({
      ...searchResponse,
      noAnswerRecommended: true,
      results: []
    }, {
      apiKey: 'test-api-key',
      model: 'claude-test-model',
      fetchImpl: async () => {
        called = true
        return createStreamResponse([])
      }
    }))

    expect(called).toBe(false)
    expect(events.map((event) => event.type)).toEqual([
      'retrieval_start',
      'sources',
      'no_answer',
      'done'
    ])
  })

  it('Claudeのstream完了を待たずにanswer_deltaをyieldする', async () => {
    const stream = createControllableTextStream()
    const eventSource = await runAnthropicAnswerProvider(searchResponse, {
      apiKey: 'test-api-key',
      model: 'claude-test-model',
      fetchImpl: async () => new Response(stream.readable)
    })
    const iterator = toAsyncIterator(eventSource)

    stream.enqueue(createTextDeltaFrame('前営業日十八時までに申請します。[1]'))

    await expect(iterator.next()).resolves.toMatchObject({
      value: {
        type: 'retrieval_start'
      },
      done: false
    })
    await expect(iterator.next()).resolves.toMatchObject({
      value: {
        type: 'sources'
      },
      done: false
    })
    await expect(iterator.next()).resolves.toMatchObject({
      value: {
        type: 'generation_start'
      },
      done: false
    })
    await expect(iterator.next()).resolves.toEqual({
      value: {
        type: 'answer_delta',
        text: '前営業日十八時までに申請します。[1]'
      },
      done: false
    })

    stream.enqueue(createMessageStopFrame())
    stream.close()
    await expect(iterator.next()).resolves.toEqual({
      value: {
        type: 'done'
      },
      done: false
    })
  })
})

describe('ANTHROPIC_MESSAGES_ENDPOINT', () => {
  it('Messages API endpointを固定する', () => {
    expect(ANTHROPIC_MESSAGES_ENDPOINT).toBe('https://api.anthropic.com/v1/messages')
  })
})

describe('Anthropic SSE parsing', () => {
  it('分割されたSSE frameからpayloadを読み取る', async () => {
    const payloads: unknown[] = []

    for await (const payload of readAnthropicSsePayloads(createTextStream([
      'event: content_block_delta\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"a"}}\n\n'
    ]))) {
      payloads.push(payload)
    }

    expect(payloads).toEqual([
      {
        type: 'content_block_delta',
        delta: {
          type: 'text_delta',
          text: 'a'
        }
      }
    ])
  })

  it('Anthropicのerror streamをsanitized error eventにする', async () => {
    const events = await collectAnthropicStreamEvents(createTextStream([
      'event: error\n',
      'data: {"type":"error","error":{"type":"overloaded_error","message":"raw provider message"}}\n\n'
    ]))

    expect(events).toEqual([
      {
        type: 'error',
        code: 'overloaded',
        message: '回答providerで一時的な問題が発生しました。'
      }
    ])
  })
})

function createStreamResponse(frames: string[]): Response {
  return new Response(createTextStream(frames), {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8'
    }
  })
}

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

async function collectEvents<T>(events: AsyncIterable<T> | Iterable<T>): Promise<T[]> {
  const collected: T[] = []

  for await (const event of events) {
    collected.push(event)
  }

  return collected
}

function toAsyncIterator<T>(events: AsyncIterable<T> | Iterable<T>): AsyncIterator<T> {
  if (isAsyncIterable(events)) {
    return events[Symbol.asyncIterator]()
  }

  return (async function* createIterator() {
    yield* events
  })()[Symbol.asyncIterator]()
}

function isAsyncIterable<T>(events: AsyncIterable<T> | Iterable<T>): events is AsyncIterable<T> {
  return typeof (events as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
}

function createControllableTextStream(): {
  readable: ReadableStream<Uint8Array>
  enqueue: (chunk: string) => void
  close: () => void
} {
  const encoder = new TextEncoder()
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
    }
  })

  return {
    readable,
    enqueue(chunk) {
      streamController?.enqueue(encoder.encode(chunk))
    },
    close() {
      streamController?.close()
    }
  }
}

function createTextDeltaFrame(text: string): string {
  return [
    'event: content_block_delta',
    `data: ${JSON.stringify({
      type: 'content_block_delta',
      delta: {
        type: 'text_delta',
        text
      }
    })}`,
    '',
    ''
  ].join('\n')
}

function createMessageStopFrame(): string {
  return [
    'event: message_stop',
    'data: {"type":"message_stop"}',
    '',
    ''
  ].join('\n')
}
