import { WORKERS_AI_EMBEDDING_MODEL, parseFirstWorkersAiEmbeddingVector } from './provider-search'

export const DEFAULT_WORKERS_AI_PROBE_TEXT = '架空RAG固定データの次元確認'

export type WorkersAiEmbeddingProbeRequest = {
  text: string[]
  truncate_inputs: boolean
}

export type WorkersAiDimensionProbeSummary = {
  model: string
  dimensions: number
  shape?: number[]
  pooling?: string
}

export function createWorkersAiEmbeddingProbeRequest(
  text: string = DEFAULT_WORKERS_AI_PROBE_TEXT
): WorkersAiEmbeddingProbeRequest {
  const trimmedText = text.trim()

  if (trimmedText.length === 0) {
    throw new Error('probe text is required')
  }

  return {
    text: [trimmedText],
    truncate_inputs: false
  }
}

export function createWorkersAiRestUrl(accountId: string, model: string = WORKERS_AI_EMBEDDING_MODEL): string {
  const normalizedAccountId = accountId.trim()
  const normalizedModel = model.trim()

  if (normalizedAccountId.length === 0) {
    throw new Error('Cloudflare account id is required')
  }

  if (normalizedModel.length === 0) {
    throw new Error('Workers AI model is required')
  }

  const modelPath = normalizedModel.split('/').map((segment) => encodeURIComponent(segment)).join('/')

  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(normalizedAccountId)}/ai/run/${modelPath}`
}

export function createWorkersAiDimensionProbeSummary(
  response: unknown,
  model: string = WORKERS_AI_EMBEDDING_MODEL
): WorkersAiDimensionProbeSummary {
  const unwrappedResponse = unwrapWorkersAiRestResponse(response)
  const vector = parseFirstWorkersAiEmbeddingVector(unwrappedResponse)
  const metadata = readEmbeddingMetadata(unwrappedResponse)

  return {
    model,
    dimensions: vector.length,
    ...metadata
  }
}

function unwrapWorkersAiRestResponse(response: unknown): unknown {
  if (!isRecord(response)) {
    return response
  }

  if (response.result !== undefined) {
    return response.result
  }

  return response
}

function readEmbeddingMetadata(response: unknown): Pick<WorkersAiDimensionProbeSummary, 'shape' | 'pooling'> {
  if (!isRecord(response)) {
    return {}
  }

  const metadata: Pick<WorkersAiDimensionProbeSummary, 'shape' | 'pooling'> = {}

  if (Array.isArray(response.shape) && response.shape.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    metadata.shape = response.shape
  }

  if (typeof response.pooling === 'string' && response.pooling.length > 0) {
    metadata.pooling = response.pooling
  }

  return metadata
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
