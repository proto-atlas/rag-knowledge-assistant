import { describe, expect, it } from 'vitest'
import { initialPublicStatus, isPublicStatus } from '../../src/shared/public-status'

describe('isPublicStatus', () => {
  it('公開ステータスのshapeが正しいとtrueを返す', () => {
    expect(isPublicStatus(initialPublicStatus)).toBe(true)
  })

  it('documentCountが負の数ならfalseを返す', () => {
    expect(isPublicStatus({
      ...initialPublicStatus,
      documentCount: -1
    })).toBe(false)
  })

  it('indexVersionが空文字ならfalseを返す', () => {
    expect(isPublicStatus({
      ...initialPublicStatus,
      indexVersion: ''
    })).toBe(false)
  })

  it('lastIndexedAtが文字列でもnullでもなければfalseを返す', () => {
    expect(isPublicStatus({
      ...initialPublicStatus,
      lastIndexedAt: 1
    })).toBe(false)
  })

  it('documentCountが欠けていたらfalseを返す', () => {
    expect(isPublicStatus({
      chunkCount: initialPublicStatus.chunkCount,
      indexVersion: initialPublicStatus.indexVersion,
      lastIndexedAt: initialPublicStatus.lastIndexedAt
    })).toBe(false)
  })

  it('chunkCountが文字列ならfalseを返す', () => {
    expect(isPublicStatus({
      ...initialPublicStatus,
      chunkCount: '24'
    })).toBe(false)
  })

  it('indexVersionが欠けていたらfalseを返す', () => {
    expect(isPublicStatus({
      documentCount: initialPublicStatus.documentCount,
      chunkCount: initialPublicStatus.chunkCount,
      lastIndexedAt: initialPublicStatus.lastIndexedAt
    })).toBe(false)
  })

  it('nullならfalseを返す', () => {
    expect(isPublicStatus(null)).toBe(false)
  })

  it('配列ならfalseを返す', () => {
    expect(isPublicStatus([])).toBe(false)
  })

  it('文字列ならfalseを返す', () => {
    expect(isPublicStatus('status')).toBe(false)
  })
})
