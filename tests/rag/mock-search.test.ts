import { createSearchRequest, extractSearchTerms, searchMockCorpus } from '../../src/rag/mock-search'

describe('createSearchRequest', () => {
  it('topK未指定なら5を使う', () => {
    expect(createSearchRequest({ question: 'リモート勤務の申請期限は？' })).toEqual({
      question: 'リモート勤務の申請期限は？',
      topK: 5,
      category: undefined
    })
  })

  it('短すぎる質問を渡すと例外を投げる', () => {
    expect(() => createSearchRequest({ question: 'AI' })).toThrow('Question must be at least 3 characters')
  })

  it('topKが範囲外なら例外を投げる', () => {
    expect(() => createSearchRequest({ question: 'リモート勤務の申請期限は？', topK: 9 })).toThrow(
      'topK must be an integer between 1 and 8'
    )
  })
})

describe('extractSearchTerms', () => {
  it('同義語を含む質問から検索語を抽出する', () => {
    expect(extractSearchTerms('在宅勤務で公共Wi-Fiを使う条件は？')).toEqual([
      '勤務',
      '公共wi-fi',
      'リモート',
      '在宅勤務で公共wi-fiを使う条件は'
    ])
  })
})

describe('searchMockCorpus', () => {
  it('リモート勤務の申請期限を聞くと対象chunkを先頭に返す', () => {
    const response = searchMockCorpus({ question: 'リモート勤務はいつまでに申請しますか？', topK: 5 })

    expect(response.results[0]?.chunkId).toBe('remote-work-policy__s1__c1')
    expect(response.noAnswerRecommended).toBe(false)
  })

  it('categoryを指定すると対象categoryだけを返す', () => {
    const response = searchMockCorpus({ question: '承認が必要な経費はいくらから？', topK: 5, category: 'finance' })

    expect(response.results.map((result) => result.category)).toEqual(['finance', 'finance', 'finance'])
  })

  it('根拠がない質問ではnoAnswerRecommendedを返す', () => {
    const response = searchMockCorpus({ question: '来週の東京の天気は？', topK: 5 })

    expect(response.noAnswerRecommended).toBe(true)
  })
})
