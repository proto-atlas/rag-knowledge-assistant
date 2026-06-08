import { describe, expect, it } from 'vitest'
import { normalizeAnthropicStreamEvent } from '../../src/worker/anthropic-stream-adapter'

describe('normalizeAnthropicStreamEvent', () => {
  it('content_block_deltaのtext_deltaをanswer_deltaへ変換する', () => {
    expect(normalizeAnthropicStreamEvent({
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text: '回答の一部'
      }
    })).toEqual({
      type: 'event',
      event: {
        type: 'answer_delta',
        text: '回答の一部'
      }
    })
  })

  it('message_stopをdoneへ変換する', () => {
    expect(normalizeAnthropicStreamEvent({
      type: 'message_stop'
    })).toEqual({
      type: 'event',
      event: {
        type: 'done'
      }
    })
  })

  it('overloaded_errorをsanitized errorへ変換する', () => {
    expect(normalizeAnthropicStreamEvent({
      type: 'error',
      error: {
        type: 'overloaded_error',
        message: 'Overloaded'
      }
    })).toEqual({
      type: 'event',
      event: {
        type: 'error',
        code: 'overloaded',
        message: '回答providerで一時的な問題が発生しました。'
      }
    })
  })

  it('pingや未知eventはUI eventにしない', () => {
    expect(normalizeAnthropicStreamEvent({ type: 'ping' })).toEqual({ type: 'ignored' })
    expect(normalizeAnthropicStreamEvent({ type: 'future_event' })).toEqual({ type: 'ignored' })
  })
})
