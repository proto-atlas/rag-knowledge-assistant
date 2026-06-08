import { describe, expect, it } from 'vitest'
import {
  ANTHROPIC_ANSWER_PROVIDER_MODE,
  MOCK_ANSWER_PROVIDER_MODE,
  createAnswerProviderEvents,
  normalizeAnswerProviderMode,
  parseAnthropicMaxTokens
} from '../../src/worker/answer-provider'
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

describe('normalizeAnswerProviderMode', () => {
  it('未指定ならmockを返す', () => {
    expect(normalizeAnswerProviderMode(undefined)).toBe(MOCK_ANSWER_PROVIDER_MODE)
    expect(normalizeAnswerProviderMode('')).toBe(MOCK_ANSWER_PROVIDER_MODE)
  })

  it('mockとanthropicだけを許可する', () => {
    expect(normalizeAnswerProviderMode(MOCK_ANSWER_PROVIDER_MODE)).toBe(MOCK_ANSWER_PROVIDER_MODE)
    expect(normalizeAnswerProviderMode(ANTHROPIC_ANSWER_PROVIDER_MODE)).toBe(ANTHROPIC_ANSWER_PROVIDER_MODE)
    expect(() => normalizeAnswerProviderMode('unknown')).toThrow('RAG_ANSWER_PROVIDER_MODE is invalid')
  })
})

describe('createAnswerProviderEvents', () => {
  it('デフォルトではmock answer providerを使う', async () => {
    const events = await collectEvents(await createAnswerProviderEvents(searchResponse, {}))

    expect(events.some((event) => event.type === 'answer_delta')).toBe(true)
    expect(events.at(-1)).toEqual({ type: 'done' })
  })

  it('anthropic指定時にlive実行設定が不足していたら例外を投げる', async () => {
    await expect(createAnswerProviderEvents(searchResponse, {
      RAG_ANSWER_PROVIDER_MODE: ANTHROPIC_ANSWER_PROVIDER_MODE
    })).rejects.toThrow('anthropic answer provider bindings are missing')
  })

  it('anthropic指定時は設定が揃えばinjected fetchでdomain eventを返す', async () => {
    const events = await collectEvents(await createAnswerProviderEvents(searchResponse, {
      RAG_ANSWER_PROVIDER_MODE: ANTHROPIC_ANSWER_PROVIDER_MODE,
      RAG_ENABLE_ANTHROPIC_LIVE: 'true',
      RAG_ANTHROPIC_API_KEY: 'test-api-key',
      RAG_CLAUDE_MODEL: 'claude-test-model'
    }, {
      fetchImpl: async () => new Response(createTextStream([
        'event: content_block_delta\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"前営業日十八時までに申請します。[1]"}}\n\n',
        'event: message_stop\n',
        'data: {"type":"message_stop"}\n\n'
      ]))
    }))

    expect(events.some((event) => event.type === 'answer_delta')).toBe(true)
    expect(JSON.stringify(events)).not.toContain('test-api-key')
  })

  it('anthropic指定時はmax token envをrequest bodyに反映する', async () => {
    let observedBody: unknown

    await collectEvents(await createAnswerProviderEvents(searchResponse, {
      RAG_ANSWER_PROVIDER_MODE: ANTHROPIC_ANSWER_PROVIDER_MODE,
      RAG_ENABLE_ANTHROPIC_LIVE: 'true',
      RAG_ANTHROPIC_API_KEY: 'test-api-key',
      RAG_CLAUDE_MODEL: 'claude-test-model',
      RAG_ANTHROPIC_MAX_TOKENS: '256'
    }, {
      fetchImpl: async (_input, init) => {
        observedBody = parseJsonBody(init?.body)

        return new Response(createTextStream([
          'event: content_block_delta\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"前営業日十八時までに申請します。[1]"}}\n\n',
          'event: message_stop\n',
          'data: {"type":"message_stop"}\n\n'
        ]))
      }
    }))

    expect(observedBody).toMatchObject({ max_tokens: 256 })
  })

  it('anthropic指定時はmax token env未指定ならrequest bodyにdefault 512を入れる', async () => {
    let observedBody: unknown

    await collectEvents(await createAnswerProviderEvents(searchResponse, {
      RAG_ANSWER_PROVIDER_MODE: ANTHROPIC_ANSWER_PROVIDER_MODE,
      RAG_ENABLE_ANTHROPIC_LIVE: 'true',
      RAG_ANTHROPIC_API_KEY: 'test-api-key',
      RAG_CLAUDE_MODEL: 'claude-test-model'
    }, {
      fetchImpl: async (_input, init) => {
        observedBody = parseJsonBody(init?.body)

        return new Response(createTextStream([
          'event: content_block_delta\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"前営業日十八時までに申請します。[1]"}}\n\n',
          'event: message_stop\n',
          'data: {"type":"message_stop"}\n\n'
        ]))
      }
    }))

    expect(observedBody).toMatchObject({ max_tokens: 512 })
  })

  it('anthropic指定時にmax token envが不正ならfetch前に例外を投げる', async () => {
    await expect(createAnswerProviderEvents(searchResponse, {
      RAG_ANSWER_PROVIDER_MODE: ANTHROPIC_ANSWER_PROVIDER_MODE,
      RAG_ENABLE_ANTHROPIC_LIVE: 'true',
      RAG_ANTHROPIC_API_KEY: 'test-api-key',
      RAG_CLAUDE_MODEL: 'claude-test-model',
      RAG_ANTHROPIC_MAX_TOKENS: 'abc'
    }, {
      fetchImpl: async () => {
        throw new Error('fetch should not be called')
      }
    })).rejects.toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  })
})

describe('parseAnthropicMaxTokens', () => {
  it('未指定ならundefinedを返す', () => {
    expect(parseAnthropicMaxTokens(undefined)).toBeUndefined()
    expect(parseAnthropicMaxTokens('')).toBeUndefined()
  })

  it('範囲内の整数文字列なら数値を返す', () => {
    expect(parseAnthropicMaxTokens('256')).toBe(256)
  })

  it('上限の整数文字列なら数値を返す', () => {
    expect(parseAnthropicMaxTokens('2048')).toBe(2048)
  })

  it('範囲外なら例外を投げる', () => {
    expect(() => parseAnthropicMaxTokens('32')).toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
    expect(() => parseAnthropicMaxTokens('4096')).toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  })

  it('非数値なら例外を投げる', () => {
    expect(() => parseAnthropicMaxTokens('abc')).toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  })

  it('0なら例外を投げる', () => {
    expect(() => parseAnthropicMaxTokens('0')).toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  })

  it('負数なら例外を投げる', () => {
    expect(() => parseAnthropicMaxTokens('-1')).toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  })

  it('小数なら例外を投げる', () => {
    expect(() => parseAnthropicMaxTokens('128.5')).toThrow('RAG_ANTHROPIC_MAX_TOKENS is invalid')
  })
})

async function collectEvents<T>(events: AsyncIterable<T> | Iterable<T>): Promise<T[]> {
  const collected: T[] = []

  for await (const event of events) {
    collected.push(event)
  }

  return collected
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

function parseJsonBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== 'string') {
    throw new Error('request body must be a JSON string')
  }

  return JSON.parse(body) as unknown
}
