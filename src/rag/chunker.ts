import type { FixtureDocumentSummary } from '../shared/fixture-documents'
import { createStableContentHash } from './hash'
import type { ChunkingOptions, ParsedMarkdownDocument, RagChunk } from './types'

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  minChunkChars: 250,
  maxChunkChars: 800
}

export function createChunks(
  document: FixtureDocumentSummary,
  parsedDocument: ParsedMarkdownDocument,
  options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS
): RagChunk[] {
  validateChunkingOptions(options)

  const chunks: RagChunk[] = []

  parsedDocument.sections.forEach((section, sectionIndex) => {
    const contentParts = splitContentIntoChunks(section.content, options)

    contentParts.forEach((content, chunkIndex) => {
      const order = chunks.length + 1
      const chunkId = `${document.slug}__s${sectionIndex + 1}__c${chunkIndex + 1}`

      chunks.push({
        chunkId,
        documentSlug: document.slug,
        documentTitle: document.title,
        category: document.category,
        tags: document.tags,
        headingPath: section.headingPath,
        content,
        contentHash: createStableContentHash(`${chunkId}:${content}`),
        charCount: content.length,
        estimatedTokenCount: estimateTokenCount(content),
        order
      })
    })
  })

  return chunks
}

export function splitContentIntoChunks(content: string, options: ChunkingOptions = DEFAULT_CHUNKING_OPTIONS): string[] {
  validateChunkingOptions(options)

  if (content.length <= options.maxChunkChars) {
    return [content]
  }

  const sentences = splitIntoSentences(content)
  const chunks: string[] = []
  let buffer = ''

  for (const sentence of sentences) {
    const nextBuffer = joinText(buffer, sentence)

    if (nextBuffer.length <= options.maxChunkChars) {
      buffer = nextBuffer
      continue
    }

    if (buffer.length >= options.minChunkChars) {
      chunks.push(buffer)
      buffer = sentence
      continue
    }

    const forcedParts = splitLongText(nextBuffer, options.maxChunkChars)
    chunks.push(...forcedParts.slice(0, -1))
    buffer = forcedParts.at(-1) ?? ''
  }

  if (buffer.length > 0) {
    chunks.push(buffer)
  }

  return chunks
}

export function estimateTokenCount(content: string): number {
  return content.length
}

function validateChunkingOptions(options: ChunkingOptions) {
  if (options.minChunkChars < 1 || options.maxChunkChars < options.minChunkChars) {
    throw new Error('Invalid chunking options')
  }
}

function splitIntoSentences(content: string): string[] {
  const matches = content.match(/[^。！？.!?]+[。！？.!?]?/g)
  return matches?.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 0) ?? [content]
}

function splitLongText(content: string, maxChunkChars: number): string[] {
  const parts: string[] = []

  for (let start = 0; start < content.length; start += maxChunkChars) {
    parts.push(content.slice(start, start + maxChunkChars).trim())
  }

  return parts.filter((part) => part.length > 0)
}

function joinText(left: string, right: string): string {
  if (left.length === 0) {
    return right
  }

  return `${left} ${right}`
}
