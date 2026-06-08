import type { SearchResponse } from '../rag/search-types'

export type RagStreamEvent =
  | { type: 'retrieval_start'; query: string }
  | { type: 'sources'; response: SearchResponse }
  | { type: 'generation_start' }
  | { type: 'answer_delta'; text: string }
  | { type: 'no_answer'; message: string }
  | { type: 'source_validation_failed'; message: string; invalidSourceIds: string[] }
  | { type: 'error'; code: 'provider_error' | 'overloaded' | 'unknown_error'; message: string }
  | { type: 'done' }

export type RagStreamEventSource = Iterable<RagStreamEvent> | AsyncIterable<RagStreamEvent>

const ANSWER_TOKEN_SIZE = 12

export function createMockRagStreamEvents(searchResponse: SearchResponse): RagStreamEvent[] {
  const events: RagStreamEvent[] = [
    {
      type: 'retrieval_start',
      query: searchResponse.query
    },
    {
      type: 'sources',
      response: searchResponse
    }
  ]

  if (searchResponse.noAnswerRecommended || searchResponse.results.length === 0) {
    return [
      ...events,
      {
        type: 'no_answer',
        message: '根拠候補が弱いため回答できません。'
      },
      {
        type: 'done'
      }
    ]
  }

  const citedSourceIds = searchResponse.results.slice(0, 2).map((result) => result.sourceId)
  const invalidSourceIds = findInvalidSourceIds(citedSourceIds, searchResponse)

  if (invalidSourceIds.length > 0) {
    return [
      ...events,
      {
        type: 'source_validation_failed',
        message: '回答の根拠を確認できなかったため表示できません。',
        invalidSourceIds
      },
      {
        type: 'done'
      }
    ]
  }

  return [
    ...events,
    {
      type: 'generation_start'
    },
    ...splitAnswer(createMockAnswer(searchResponse, citedSourceIds)).map<RagStreamEvent>((text) => ({
      type: 'answer_delta',
      text
    })),
    {
      type: 'done'
    }
  ]
}

export function findInvalidSourceIds(sourceIds: string[], searchResponse: SearchResponse): string[] {
  const validSourceIds = new Set(searchResponse.results.map((result) => result.sourceId))
  return sourceIds.filter((sourceId) => !validSourceIds.has(sourceId))
}

export function extractCitedSourceIds(text: string): string[] {
  const sourceIds = new Set<string>()
  const matches = text.matchAll(/\[(\d+)\]/g)

  for (const match of matches) {
    sourceIds.add(match[1] ?? '')
  }

  return [...sourceIds].filter((sourceId) => sourceId.length > 0)
}

export function createSseResponse(events: RagStreamEventSource, signal?: AbortSignal): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      if (signal?.aborted) {
        controller.close()
        return
      }

      try {
        for await (const event of events) {
          if (signal?.aborted) {
            break
          }

          controller.enqueue(encoder.encode(encodeSseEvent(event)))
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/event-stream; charset=utf-8',
      'x-content-type-options': 'nosniff'
    }
  })
}

export function encodeSseEvent(event: RagStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

function createMockAnswer(searchResponse: SearchResponse, sourceIds: string[]): string {
  const firstResult = searchResponse.results[0]

  if (!firstResult) {
    return '根拠候補がないため回答できません。'
  }

  const sourceLabel = sourceIds.map((sourceId) => `[${sourceId}]`).join(' ')
  const heading = firstResult.headingPath.at(-1) ?? firstResult.documentTitle

  return `${heading}に関する根拠候補では、${firstResult.excerpt} ${sourceLabel}`
}

function splitAnswer(answer: string): string[] {
  return answer.match(new RegExp(`.{1,${ANSWER_TOKEN_SIZE}}`, 'gu')) ?? [answer]
}
