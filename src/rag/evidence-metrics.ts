export type NumberSummary = {
  count: number
  min: number
  max: number
  average: number
  p50: number
  p95: number
}

export function summarizeNumbers(values: number[]): NumberSummary {
  if (values.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      p50: 0,
      p95: 0
    }
  }

  const sorted = [...values].sort((left, right) => left - right)
  const total = sorted.reduce((sum, value) => sum + value, 0)

  return {
    count: sorted.length,
    min: sorted[0] ?? 0,
    max: sorted.at(-1) ?? 0,
    average: total / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95)
  }
}

export function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0
  }

  const boundedPercentile = Math.min(100, Math.max(0, percentileValue))
  const rawIndex = Math.ceil((boundedPercentile / 100) * sortedValues.length) - 1
  const index = Math.min(sortedValues.length - 1, Math.max(0, rawIndex))
  return sortedValues[index] ?? 0
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(2)} kB`
}

export function formatMilliseconds(value: number): string {
  return `${value.toFixed(2)} ms`
}
