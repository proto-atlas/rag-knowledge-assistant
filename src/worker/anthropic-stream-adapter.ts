import type { RagStreamEvent } from './rag-stream'

export type AnthropicAdapterResult =
  | { type: 'event'; event: RagStreamEvent }
  | { type: 'ignored' }

export function normalizeAnthropicStreamEvent(value: unknown): AnthropicAdapterResult {
  const record = toRecord(value)
  const type = typeof record.type === 'string' ? record.type : ''

  if (type === 'content_block_delta') {
    const delta = toRecord(record.delta)

    if (delta.type === 'text_delta' && typeof delta.text === 'string') {
      return {
        type: 'event',
        event: {
          type: 'answer_delta',
          text: delta.text
        }
      }
    }

    return { type: 'ignored' }
  }

  if (type === 'message_stop') {
    return {
      type: 'event',
      event: {
        type: 'done'
      }
    }
  }

  if (type === 'error') {
    const error = toRecord(record.error)
    const providerErrorType = typeof error.type === 'string' ? error.type : 'unknown_error'

    return {
      type: 'event',
      event: {
        type: 'error',
        code: toRagProviderErrorCode(providerErrorType),
        message: '回答providerで一時的な問題が発生しました。'
      }
    }
  }

  return { type: 'ignored' }
}

function toRagProviderErrorCode(value: string): 'provider_error' | 'overloaded' | 'unknown_error' {
  if (value === 'overloaded_error') {
    return 'overloaded'
  }

  if (value.trim().length === 0) {
    return 'unknown_error'
  }

  return 'provider_error'
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}
