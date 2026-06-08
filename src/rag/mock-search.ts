import type { FixtureCategory } from '../shared/fixture-documents'
import { FIXTURE_INDEX_VERSION } from '../shared/fixture-index-summary'
import { mockSearchCorpus } from './mock-corpus'
import type { SearchCorpusChunk, SearchRequest, SearchResponse, SearchResult } from './search-types'

export const DEFAULT_TOP_K = 5
export const MAX_TOP_K = 8
export const MIN_ANSWERABLE_SCORE = 1

const DOMAIN_TERMS = [
  'リモート',
  '勤務',
  '申請',
  'VPN',
  '公共Wi-Fi',
  '離席',
  '連絡ルール',
  '経費',
  '領収書',
  '五万円',
  '精算',
  '社内アカウント',
  '多要素認証',
  'パスワード',
  '端末',
  '紛失',
  '外部共有',
  'インシデント',
  '十五分',
  'secret',
  '漏えい',
  '封じ込め',
  'ローテーション',
  'ポストモーテム',
  '入社',
  'オンボーディング',
  '一週間',
  'メンター',
  'Business',
  'プラン',
  '監査ログ',
  'Webhook',
  '通知',
  '優先度',
  '開発チーム',
  '顧客連絡',
  'リリース',
  'デプロイ',
  'ロールバック',
  'リリースチェック'
]

const SYNONYMS: Record<string, string[]> = {
  いつまで: ['前営業日', '十八時', '九時三十分'],
  在宅: ['リモート', '勤務'],
  MFA: ['多要素認証'],
  二要素: ['多要素認証'],
  認証方式: ['多要素認証'],
  承認: ['申請', '承認', '部門責任者'],
  期限: ['まで', '時'],
  何分: ['十五分'],
  いつまでに連絡: ['一時間以内'],
  初日: ['入社初日', '多要素認証'],
  初日に: ['入社初日', '多要素認証'],
  再試行: ['最大三回', 'Webhook'],
  復元期間: ['三十日間', '削除'],
  共有: ['共有範囲', '有効期限'],
  チェック: ['typecheck', 'lint', 'unit test', 'E2E', 'build', 'リリースチェック'],
  障害: ['インシデント', '障害'],
  漏洩: ['漏えい', 'secret', 'ローテーション'],
  料金: ['プラン'],
  差し戻し: ['却下'],
  本番: ['リリース', 'デプロイ'],
  戻す: ['ロールバック'],
  引き継ぎ: ['開発チーム', '引き継ぎ']
}

export function searchMockCorpus(request: SearchRequest, corpus: SearchCorpusChunk[] = mockSearchCorpus): SearchResponse {
  const terms = extractSearchTerms(request.question)
  const filteredCorpus = request.category
    ? corpus.filter((chunk) => chunk.category === request.category)
    : corpus

  const results = filteredCorpus
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, terms, request.question) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.chunk.chunkId.localeCompare(right.chunk.chunkId))
    .slice(0, request.topK)
    .map((entry, index) => toSearchResult(entry.chunk, entry.score, index))

  const topScore = results[0]?.score ?? 0

  return {
    query: request.question,
    topK: request.topK,
    indexVersion: FIXTURE_INDEX_VERSION,
    noAnswerRecommended: topScore < MIN_ANSWERABLE_SCORE,
    results
  }
}

export function createSearchRequest(input: { question: string; topK?: number; category?: FixtureCategory }): SearchRequest {
  const question = input.question.trim()

  if (question.length < 3) {
    throw new Error('Question must be at least 3 characters')
  }

  if (question.length > 500) {
    throw new Error('Question must be at most 500 characters')
  }

  const topK = input.topK ?? DEFAULT_TOP_K

  if (!Number.isInteger(topK) || topK < 1 || topK > MAX_TOP_K) {
    throw new Error('topK must be an integer between 1 and 8')
  }

  return {
    question,
    topK,
    category: input.category
  }
}

export function extractSearchTerms(question: string): string[] {
  const normalizedQuestion = normalizeText(question)
  const terms = new Set<string>()

  for (const term of DOMAIN_TERMS) {
    if (normalizedQuestion.includes(normalizeText(term))) {
      terms.add(normalizeText(term))
    }
  }

  for (const [trigger, values] of Object.entries(SYNONYMS)) {
    if (normalizedQuestion.includes(normalizeText(trigger))) {
      values.forEach((value) => terms.add(normalizeText(value)))
    }
  }

  question
    .split(/[\s、。,.!?！？/・]+/)
    .map((token) => normalizeText(token))
    .filter((token) => token.length >= 2)
    .forEach((token) => terms.add(token))

  return [...terms]
}

function scoreChunk(chunk: SearchCorpusChunk, terms: string[], originalQuestion: string): number {
  const normalizedContent = normalizeText(chunk.content)
  const normalizedTitle = normalizeText(chunk.documentTitle)
  const normalizedHeading = normalizeText(chunk.headingPath.join(' '))
  const normalizedTags = normalizeText(chunk.tags.join(' '))
  const normalizedQuestion = normalizeText(originalQuestion)
  let score = 0

  for (const term of terms) {
    if (normalizedContent.includes(term)) {
      score += 1
    }

    if (normalizedTitle.includes(term)) {
      score += 2
    }

    if (normalizedHeading.includes(term)) {
      score += 1.5
    }

    if (normalizedTags.includes(term)) {
      score += 1
    }
  }

  if (normalizedContent.includes(normalizedQuestion)) {
    score += 3
  }

  return Number(score.toFixed(3))
}

function toSearchResult(chunk: SearchCorpusChunk, score: number, index: number): SearchResult {
  return {
    sourceId: String(index + 1),
    chunkId: chunk.chunkId,
    documentSlug: chunk.documentSlug,
    documentTitle: chunk.documentTitle,
    headingPath: chunk.headingPath,
    excerpt: chunk.content,
    category: chunk.category,
    tags: chunk.tags,
    score
  }
}

function normalizeText(input: string): string {
  return input.normalize('NFKC').toLocaleLowerCase('ja-JP')
}
