import { describe, expect, it } from 'vitest'
import { formatBytes, formatMilliseconds, percentile, summarizeNumbers } from '../../src/rag/evidence-metrics'

describe('summarizeNumbers', () => {
  it('空配列を渡すと0件のsummaryを返す', () => {
    expect(summarizeNumbers([])).toEqual({
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      p50: 0,
      p95: 0
    })
  })

  it('数値配列を渡すと平均とpercentileを返す', () => {
    expect(summarizeNumbers([10, 20, 30, 40])).toEqual({
      count: 4,
      min: 10,
      max: 40,
      average: 25,
      p50: 20,
      p95: 40
    })
  })
})

describe('percentile', () => {
  it('範囲外のpercentileを渡すと端の値へ丸める', () => {
    expect(percentile([10, 20, 30], -1)).toBe(10)
    expect(percentile([10, 20, 30], 101)).toBe(30)
  })
})

describe('formatBytes', () => {
  it('1024 bytes未満はB表記にする', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('1024 bytes以上はkB表記にする', () => {
    expect(formatBytes(1536)).toBe('1.50 kB')
  })
})

describe('formatMilliseconds', () => {
  it('小数2桁のms表記にする', () => {
    expect(formatMilliseconds(12.345)).toBe('12.35 ms')
  })
})
