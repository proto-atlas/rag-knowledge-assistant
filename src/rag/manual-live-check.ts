export const MANUAL_LIVE_RAG_CHECK_CONFIRM_FLAG = '--confirm-manual-live-rag-check'

export type ManualLiveCheckCase = {
  id: 'known-answer' | 'no-answer'
  question: string
  topK: number
}

export type ManualLiveCheckSummary = {
  eventTypes: string[]
  answerDeltaCount: number
  hasSources: boolean
  hasDone: boolean
  hasNoAnswer: boolean
  hasSourceValidationFailed: boolean
  hasProviderError: boolean
  sourceIds: string[]
  leakedNeedles: string[]
}

export type ManualLiveCheckEvaluation = {
  ok: boolean
  failedAssertions: string[]
}

export function createManualLiveCheckCases(): ManualLiveCheckCase[] {
  return [
    {
      id: 'known-answer',
      question: 'リモート勤務の申請期限は？',
      topK: 5
    },
    {
      id: 'no-answer',
      question: '天気予報を教えて',
      topK: 5
    }
  ]
}

export function createManualLiveCheckRequestBody(testCase: ManualLiveCheckCase): { question: string; topK: number } {
  return {
    question: testCase.question,
    topK: testCase.topK
  }
}

export function evaluateManualLiveCheckCase(
  testCase: Pick<ManualLiveCheckCase, 'id'>,
  summary: ManualLiveCheckSummary
): ManualLiveCheckEvaluation {
  const failedAssertions: string[] = []

  assertCondition(failedAssertions, summary.hasDone, 'hasDone')
  assertCondition(failedAssertions, summary.hasSources, 'hasSources')
  assertCondition(failedAssertions, summary.leakedNeedles.length === 0, 'noSecretLeak')
  assertCondition(failedAssertions, !summary.hasProviderError, 'noProviderError')

  if (testCase.id === 'known-answer') {
    assertCondition(failedAssertions, summary.answerDeltaCount > 0, 'knownAnswerHasAnswerDelta')
    assertCondition(failedAssertions, !summary.hasSourceValidationFailed, 'knownAnswerNoSourceValidationFailed')
    assertCondition(failedAssertions, summary.sourceIds.length > 0, 'knownAnswerHasSourceIds')
  } else {
    assertCondition(failedAssertions, summary.answerDeltaCount === 0, 'noAnswerHasNoAnswerDelta')
    assertCondition(failedAssertions, summary.hasNoAnswer, 'noAnswerEvent')
    assertCondition(failedAssertions, !summary.hasSourceValidationFailed, 'noAnswerNoSourceValidationFailed')
  }

  return {
    ok: failedAssertions.length === 0,
    failedAssertions
  }
}

export async function readRagSsePayloads(stream: ReadableStream<Uint8Array>): Promise<unknown[]> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const payloads: unknown[] = []
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const parsed = parseRagSseFrames(buffer)
    buffer = parsed.remaining
    payloads.push(...parsed.payloads)
  }

  const trailingFrame = buffer.trim()

  if (trailingFrame.length > 0) {
    payloads.push(parseRagSseFrame(trailingFrame))
  }

  return payloads
}

export function summarizeRagSsePayloads(payloads: unknown[], secretNeedles: string[]): ManualLiveCheckSummary {
  const eventTypes = payloads.map((payload) => getPayloadType(payload))
  const sourceIds = collectSourceIds(payloads)
  const serialized = JSON.stringify(payloads)

  return {
    eventTypes,
    answerDeltaCount: eventTypes.filter((type) => type === 'answer_delta').length,
    hasSources: eventTypes.includes('sources'),
    hasDone: eventTypes.includes('done'),
    hasNoAnswer: eventTypes.includes('no_answer'),
    hasSourceValidationFailed: eventTypes.includes('source_validation_failed'),
    hasProviderError: eventTypes.includes('error'),
    sourceIds,
    leakedNeedles: secretNeedles.filter((needle) => needle.length > 0 && serialized.includes(needle))
  }
}

function assertCondition(failedAssertions: string[], condition: boolean, name: string): void {
  if (!condition) {
    failedAssertions.push(name)
  }
}

function parseRagSseFrames(buffer: string): { payloads: unknown[]; remaining: string } {
  const payloads: unknown[] = []
  let remaining = buffer
  let separatorIndex = remaining.indexOf('\n\n')

  while (separatorIndex >= 0) {
    const frame = remaining.slice(0, separatorIndex).trim()
    remaining = remaining.slice(separatorIndex + 2)

    if (frame.length > 0) {
      payloads.push(parseRagSseFrame(frame))
    }

    separatorIndex = remaining.indexOf('\n\n')
  }

  return {
    payloads,
    remaining
  }
}

function parseRagSseFrame(frame: string): unknown {
  const dataLines: string[] = []

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  if (dataLines.length === 0) {
    return {
      type: 'invalid_frame'
    }
  }

  try {
    return JSON.parse(dataLines.join('\n')) as unknown
  } catch {
    return {
      type: 'invalid_json'
    }
  }
}

function getPayloadType(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return 'invalid_payload'
  }

  const type = (payload as Record<string, unknown>).type
  return typeof type === 'string' ? type : 'unknown'
}

function collectSourceIds(payloads: unknown[]): string[] {
  const ids = new Set<string>()

  for (const payload of payloads) {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      continue
    }

    const record = payload as Record<string, unknown>

    if (record.type !== 'sources') {
      continue
    }

    const response = record.response

    if (typeof response !== 'object' || response === null || Array.isArray(response)) {
      continue
    }

    const results = (response as Record<string, unknown>).results

    if (!Array.isArray(results)) {
      continue
    }

    for (const result of results) {
      if (typeof result !== 'object' || result === null || Array.isArray(result)) {
        continue
      }

      const sourceId = (result as Record<string, unknown>).sourceId

      if (typeof sourceId === 'string') {
        ids.add(sourceId)
      }
    }
  }

  return [...ids]
}
