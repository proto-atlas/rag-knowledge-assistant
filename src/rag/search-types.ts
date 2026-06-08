import type { FixtureCategory } from '../shared/fixture-documents'

export type SearchCorpusChunk = {
  chunkId: string
  documentSlug: string
  documentTitle: string
  category: FixtureCategory
  tags: string[]
  headingPath: string[]
  content: string
  indexVersion: string
}

export type SearchRequest = {
  question: string
  topK: number
  category?: FixtureCategory
}

export type SearchResult = {
  sourceId: string
  chunkId: string
  documentSlug: string
  documentTitle: string
  headingPath: string[]
  excerpt: string
  category: FixtureCategory
  tags: string[]
  score: number
}

export type SearchResponse = {
  query: string
  topK: number
  indexVersion: string
  noAnswerRecommended: boolean
  results: SearchResult[]
}
