import type { FixtureCategory } from '../shared/fixture-documents'

export type MarkdownSection = {
  headingPath: string[]
  content: string
}

export type ParsedMarkdownDocument = {
  title: string
  sections: MarkdownSection[]
}

export type RagChunk = {
  chunkId: string
  documentSlug: string
  documentTitle: string
  category: FixtureCategory
  tags: string[]
  headingPath: string[]
  content: string
  contentHash: string
  charCount: number
  estimatedTokenCount: number
  order: number
}

export type ChunkingOptions = {
  minChunkChars: number
  maxChunkChars: number
}
