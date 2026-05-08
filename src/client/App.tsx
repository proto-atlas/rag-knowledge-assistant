import { type FormEvent, type MutableRefObject, useEffect, useRef, useState } from 'react'
import { streamAskKnowledgeBase } from './ask-api'
import { searchKnowledgeBase, SearchApiError, type SearchApiErrorCode } from './search-api'
import { fixtureCategories, fixtureDocuments, type FixtureCategory } from '../shared/fixture-documents'
import { initialPublicStatus, isPublicStatus, type PublicStatus } from '../shared/public-status'
import { retrievalEvalSummary } from '../shared/retrieval-eval-summary'
import type { SearchResponse } from '../rag/search-types'

const QUESTION_MAX_LENGTH = 500
const TOP_K_OPTIONS = [3, 5, 8] as const

type CategoryFilter = 'all' | FixtureCategory
type SearchStatus = 'idle' | 'loading' | 'success' | 'no-answer' | 'error' | 'unauthorized'
type AnswerStatus = 'idle' | 'streaming' | 'done' | 'aborted' | 'no-answer' | 'source-validation-failed' | 'error'

type SearchUiError = {
  code: SearchApiErrorCode
  message: string
}

const flowSteps = [
  '質問をembedding化',
  'Vectorizeで関連chunkを検索',
  'D1からchunk本文を取得',
  '根拠が弱い場合は回答しない',
  '根拠chunkだけをClaudeへ渡す',
  'source付き回答を検証して表示'
] as const

async function fetchPublicStatus(): Promise<PublicStatus> {
  const response = await fetch('/api/public/status')

  if (!response.ok) {
    throw new Error('public status request failed')
  }

  const payload: unknown = await response.json()

  if (!isPublicStatus(payload)) {
    throw new Error('public status response shape unexpected')
  }

  return payload
}

export function App() {
  const [status, setStatus] = useState<PublicStatus>(initialPublicStatus)
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [activeStep, setActiveStep] = useState<number>(0)
  const [accessKey, setAccessKey] = useState<string>('')
  const [question, setQuestion] = useState<string>('')
  const [topK, setTopK] = useState<number>(5)
  const [searchCategory, setSearchCategory] = useState<CategoryFilter>('all')
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle')
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  const [searchError, setSearchError] = useState<SearchUiError | null>(null)
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle')
  const [answerText, setAnswerText] = useState<string>('')
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState<string>('検索条件を入力してください。')
  const answerAbortRef = useRef<AbortController | null>(null)
  const answerRequestIdRef = useRef<number>(0)
  const sourceCardRefs = useRef<Record<string, HTMLLIElement | null>>({})

  useEffect(() => {
    let isMounted = true

    fetchPublicStatus()
      .then((nextStatus) => {
        if (isMounted) {
          setStatus(nextStatus)
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus(initialPublicStatus)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const visibleDocuments = fixtureDocuments.filter((document) => {
    return selectedTag === 'all' || document.category === selectedTag
  })
  const trimmedQuestion = question.trim()
  const isQuestionTooShort = trimmedQuestion.length > 0 && trimmedQuestion.length < 3
  const isQuestionTooLong = question.length > QUESTION_MAX_LENGTH
  const canSearch = accessKey.trim().length > 0
    && trimmedQuestion.length >= 3
    && !isQuestionTooLong
    && searchStatus !== 'loading'

  useEffect(() => {
    return () => {
      answerAbortRef.current?.abort()
    }
  }, [])

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSearch) {
      setSearchStatus('error')
      setSearchError({
        code: 'bad_request',
        message: 'access keyと3文字以上の質問を入力してください。'
      })
      setLiveMessage('検索条件が不足しています。')
      return
    }

    setSearchStatus('loading')
    setSearchError(null)
    setSearchResponse(null)
    resetAnswerState()
    setLiveMessage('検索中です。')

    try {
      const response = await searchKnowledgeBase({
        accessKey: accessKey.trim(),
        question: trimmedQuestion,
        topK,
        category: searchCategory === 'all' ? undefined : searchCategory
      })

      setSearchResponse(response)

      if (response.noAnswerRecommended || response.results.length === 0) {
        setSearchStatus('no-answer')
        setLiveMessage('根拠候補が弱いため、回答生成へ進まない判断になりました。')
        return
      }

      setSearchStatus('success')
      setLiveMessage(`${response.results.length}件の根拠候補を取得しました。`)
    } catch (error) {
      const nextError = toSearchUiError(error)
      setSearchError(nextError)
      setSearchStatus(nextError.code === 'unauthorized' ? 'unauthorized' : 'error')
      setLiveMessage(nextError.message)
    }
  }

  async function handleServerAnswerStart() {
    if (!canSearch) {
      setAnswerStatus('error')
      setAnswerError('access keyと3文字以上の質問を入力してください。')
      setLiveMessage('回答生成条件が不足しています。')
      return
    }

    answerAbortRef.current?.abort()
    const controller = new AbortController()
    const requestId = answerRequestIdRef.current + 1
    answerAbortRef.current = controller
    answerRequestIdRef.current = requestId
    setAnswerStatus('streaming')
    setAnswerText('')
    setAnswerError(null)
    setSearchStatus('loading')
    setSearchError(null)
    setSearchResponse(null)
    setLiveMessage('サーバーSSEで回答を生成しています。')
    let terminalStatus: AnswerStatus | null = null

    try {
      for await (const event of streamAskKnowledgeBase({
        accessKey: accessKey.trim(),
        question: trimmedQuestion,
        topK,
        category: searchCategory === 'all' ? undefined : searchCategory,
        signal: controller.signal
      })) {
        if (answerRequestIdRef.current !== requestId) {
          return
        }

        if (event.type === 'retrieval_start') {
          setLiveMessage('回答用の根拠候補を検索しています。')
          continue
        }

        if (event.type === 'sources') {
          setSearchResponse(event.response)
          setSearchStatus(event.response.noAnswerRecommended || event.response.results.length === 0 ? 'no-answer' : 'success')
          continue
        }

        if (event.type === 'generation_start') {
          setLiveMessage('回答本文をstreamingしています。')
          continue
        }

        if (event.type === 'answer_delta') {
          setAnswerText((currentText) => `${currentText}${event.text}`)
          continue
        }

        if (event.type === 'no_answer') {
          terminalStatus = 'no-answer'
          setAnswerStatus('no-answer')
          setAnswerError(event.message)
          setLiveMessage(event.message)
          continue
        }

        if (event.type === 'source_validation_failed') {
          terminalStatus = 'source-validation-failed'
          setAnswerStatus('source-validation-failed')
          setAnswerText('')
          setAnswerError(`${event.message} invalid source ids: ${event.invalidSourceIds.join(', ')}`)
          setLiveMessage('回答の根拠を確認できなかったため表示できません。')
          continue
        }

        if (event.type === 'error') {
          terminalStatus = 'error'
          setAnswerStatus('error')
          setAnswerError(event.message)
          setLiveMessage(event.message)
          continue
        }

        if (!terminalStatus) {
          terminalStatus = 'done'
          setAnswerStatus('done')
          setLiveMessage('サーバーSSE回答の生成が完了しました。')
        }
      }
    } catch {
      if (controller.signal.aborted) {
        if (answerRequestIdRef.current === requestId) {
          setAnswerStatus('aborted')
          setSearchStatus(searchResponse ? 'success' : 'idle')
          setLiveMessage('サーバーSSE回答生成を中断しました。')
        }
        return
      }

      if (answerRequestIdRef.current === requestId) {
          setAnswerStatus('error')
          setAnswerError('サーバーSSE回答生成に失敗しました。')
          setSearchStatus('error')
          setSearchError({
            code: 'unknown_error',
            message: 'サーバーSSE回答生成に失敗しました。'
          })
          setLiveMessage('サーバーSSE回答生成に失敗しました。')
        }
      }
  }

  function handleServerAnswerAbort() {
    answerAbortRef.current?.abort()
  }

  function resetAnswerState() {
    answerAbortRef.current?.abort()
    answerRequestIdRef.current += 1
    setAnswerStatus('idle')
    setAnswerText('')
    setAnswerError(null)
  }

  function handleSourceReference(sourceId: string) {
    const sourceCard = sourceCardRefs.current[sourceId]

    if (!sourceCard) {
      setLiveMessage(`Source ${sourceId} が見つかりません。`)
      return
    }

    sourceCard.focus()
    sourceCard.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
    setLiveMessage(`Source ${sourceId} へ移動しました。`)
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="hero__content">
          <p className="eyebrow">RAG Knowledge Assistant</p>
          <h1 id="page-title">架空文書を検索し、根拠付き回答を生成するRAGデモ</h1>
          <p className="hero__lead">
            この公開画面では、架空文書一覧、RAG処理フロー、評価証跡の入口を確認できます。動的な検索と回答生成は、課金と乱用防止のためaccess keyで保護します。
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="documents-title">
        <div className="section__header">
          <h2 id="documents-title">架空文書</h2>
          <div className="segmented" aria-label="文書タグ">
            {['all', ...fixtureCategories].map((tag) => (
              <button
                className={selectedTag === tag ? 'segmented__button segmented__button--active' : 'segmented__button'}
                key={tag}
                onClick={() => setSelectedTag(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <ul className="document-list">
          {visibleDocuments.map((document) => (
            <li className="document-list__item" key={document.title}>
              <span>{document.title}</span>
              <span className="tag">{document.category}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="flow-title">
        <div className="section__header">
          <h2 id="flow-title">RAG処理フロー</h2>
          <p>access key付きの検索と回答生成では、Workers AI、Vectorize、D1、Anthropicを通る限定live経路を確認できます。</p>
        </div>
        <div className="flow">
          <ol className="flow__steps">
            {flowSteps.map((step, index) => (
              <li key={step}>
                <button
                  className={activeStep === index ? 'flow__step flow__step--active' : 'flow__step'}
                  onClick={() => setActiveStep(index)}
                  type="button"
                >
                  <span>{index + 1}</span>
                  {step}
                </button>
              </li>
            ))}
          </ol>
          <div className="flow__detail" aria-live="polite">
            <strong>Step {activeStep + 1}</strong>
            <p>{flowSteps[activeStep]}</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="status-title">
        <h2 id="status-title">Index状態</h2>
        <dl className="status-grid">
          <div>
            <dt>Documents</dt>
            <dd>{status.documentCount}</dd>
          </div>
          <div>
            <dt>Chunks</dt>
            <dd>{status.chunkCount}</dd>
          </div>
          <div>
            <dt>Index version</dt>
            <dd>{status.indexVersion}</dd>
          </div>
          <div>
            <dt>Last indexed</dt>
            <dd>{status.lastIndexedAt ?? 'not indexed'}</dd>
          </div>
        </dl>
      </section>

      <section className="section" aria-labelledby="eval-title">
        <div className="section__header">
          <div>
            <h2 id="eval-title">Retrieval eval summary</h2>
            <p className="section__note">
              mock lexical retrievalの固定fixture証跡です。限定live demoで使うWorkers AI、Vectorize、Claude APIの品質を直接証明するものではありません。
            </p>
          </div>
          <span className="eval-scope">{retrievalEvalSummary.scope}</span>
        </div>
        <dl className="eval-overview" aria-label="retrieval eval fixture summary">
          <div>
            <dt>Total fixtures</dt>
            <dd>{retrievalEvalSummary.totalFixtures}</dd>
          </div>
          <div>
            <dt>Answerable</dt>
            <dd>{retrievalEvalSummary.answerableFixtures}</dd>
          </div>
          <div>
            <dt>No-answer</dt>
            <dd>{retrievalEvalSummary.noAnswerFixtures}</dd>
          </div>
          <div>
            <dt>Failed cases</dt>
            <dd>{retrievalEvalSummary.failedCases}</dd>
          </div>
        </dl>
        <ul className="eval-grid" aria-label="retrieval eval metrics">
          {retrievalEvalSummary.metrics.map((metric) => (
            <li className="eval-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="search-title">
        <h2 id="search-title">動的検索</h2>
        <p className="section__note">
          access key付きの検索はWorkers AI embedding、Vectorize検索、D1 source lookupを呼びます。回答生成は根拠が十分な場合だけClaude APIへ進みます。access keyはcost guard用で、ブラウザのstate上だけに保持し、保存しません。
        </p>
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <label htmlFor="access-key">Access key</label>
          <input
            autoComplete="off"
            id="access-key"
            onChange={(event) => setAccessKey(event.target.value)}
            placeholder="レビュー用access key"
            type="password"
            value={accessKey}
          />
          <div className="search-form__row">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              onChange={(event) => setSearchCategory(event.target.value as CategoryFilter)}
              value={searchCategory}
            >
              <option value="all">all</option>
              {fixtureCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label htmlFor="top-k">Top K</label>
            <select
              id="top-k"
              onChange={(event) => setTopK(Number(event.target.value))}
              value={topK}
            >
              {TOP_K_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <label htmlFor="question">質問</label>
          <textarea
            id="question"
            maxLength={QUESTION_MAX_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例: リモート勤務の申請期限は？"
            rows={4}
            value={question}
          />
          <div className="search-form__meta">
            <span>{question.length} / {QUESTION_MAX_LENGTH}</span>
            {isQuestionTooShort ? <span role="alert">質問は3文字以上で入力してください。</span> : null}
            {isQuestionTooLong ? <span role="alert">質問は500文字以内で入力してください。</span> : null}
          </div>
          <button disabled={!canSearch} type="submit">
            {searchStatus === 'loading' && answerStatus !== 'streaming' ? '検索中' : '根拠候補だけ検索'}
          </button>
          <button
            disabled={!canSearch || answerStatus === 'streaming'}
            onClick={handleServerAnswerStart}
            type="button"
          >
            {answerStatus === 'streaming' ? '回答生成中' : '検索して回答生成'}
          </button>
        </form>
        <p className="sr-status" aria-live="polite">{liveMessage}</p>
        <SearchResultPanel
          answerError={answerError}
          answerStatus={answerStatus}
          answerText={answerText}
          onAbortAnswer={handleServerAnswerAbort}
          onStartAnswer={handleServerAnswerStart}
          onSourceReference={handleSourceReference}
          response={searchResponse}
          sourceCardRefs={sourceCardRefs}
          status={searchStatus}
          error={searchError}
        />
      </section>
    </main>
  )
}

function SearchResultPanel(props: {
  answerError: string | null
  answerStatus: AnswerStatus
  answerText: string
  onAbortAnswer: () => void
  onStartAnswer: () => void
  onSourceReference: (sourceId: string) => void
  response: SearchResponse | null
  sourceCardRefs: MutableRefObject<Record<string, HTMLLIElement | null>>
  status: SearchStatus
  error: SearchUiError | null
}) {
  if (props.status === 'idle') {
    return (
      <div className="search-panel search-panel--muted">
        access keyと質問を入力すると、限定live retrievalの根拠候補を確認できます。
      </div>
    )
  }

  if (props.status === 'loading') {
    return (
      <div className="search-panel search-panel--muted" role="status">
        根拠候補を検索しています。
      </div>
    )
  }

  if (props.status === 'unauthorized') {
    return (
      <div className="search-panel search-panel--error" role="alert">
        {props.error?.message ?? 'access keyを確認してください。'}
      </div>
    )
  }

  if (props.status === 'error') {
    return (
      <div className="search-panel search-panel--error" role="alert">
        {props.error?.message ?? '検索に失敗しました。'}
      </div>
    )
  }

  if (props.status === 'no-answer') {
    return (
      <div className="search-panel search-panel--warning" role="status">
        <h3>回答しない判断</h3>
        <p>検索結果の根拠が弱いため、Claude APIへ進まず回答しない判断になりました。</p>
        <SourceCards
          response={props.response}
          sourceCardRefs={props.sourceCardRefs}
        />
      </div>
    )
  }

  return (
    <div className="search-panel" role="status">
      <h3>検索結果</h3>
      <p>取得した根拠候補です。scoreは正しさではなく、retrieval provider上の近さです。</p>
      <SourceCards
        response={props.response}
        sourceCardRefs={props.sourceCardRefs}
      />
      <ServerAnswerPanel
        error={props.answerError}
        onAbort={props.onAbortAnswer}
        onStart={props.onStartAnswer}
        onSourceReference={props.onSourceReference}
        response={props.response}
        status={props.answerStatus}
        text={props.answerText}
      />
    </div>
  )
}

function ServerAnswerPanel(props: {
  error: string | null
  onAbort: () => void
  onStart: () => void
  onSourceReference: (sourceId: string) => void
  response: SearchResponse | null
  status: AnswerStatus
  text: string
}) {
  return (
    <section className="answer-panel" aria-labelledby="answer-title">
      <div className="answer-panel__header">
        <div>
          <h3 id="answer-title">Server streaming answer</h3>
          <p>根拠候補をもとにClaude APIのstreaming回答を受信し、source id検証後のUI状態まで確認します。</p>
        </div>
        <div className="answer-panel__actions">
          <button
            disabled={props.status === 'streaming'}
            onClick={props.onStart}
            type="button"
          >
            サーバーSSE回答を生成
          </button>
          <button
            disabled={props.status !== 'streaming'}
            onClick={props.onAbort}
            type="button"
          >
            中断
          </button>
        </div>
      </div>
      <AnswerBody
        error={props.error}
        onSourceReference={props.onSourceReference}
        response={props.response}
        status={props.status}
        text={props.text}
      />
    </section>
  )
}

function AnswerBody(props: {
  error: string | null
  onSourceReference: (sourceId: string) => void
  response: SearchResponse | null
  status: AnswerStatus
  text: string
}) {
  if (props.status === 'idle') {
    return <div className="answer-box answer-box--muted">検索結果を使ってmock回答生成を試せます。</div>
  }

  if (props.status === 'source-validation-failed') {
    return (
      <div className="answer-box answer-box--warning" role="alert">
        <strong>回答を表示できません。</strong>
        <p>{props.error ?? '回答の根拠を確認できませんでした。'}</p>
        <p>質問を具体化するか、source cardだけを確認してください。</p>
      </div>
    )
  }

  if (props.status === 'no-answer') {
    return (
      <div className="answer-box answer-box--warning" role="status">
        <strong>回答しない判断</strong>
        <p>{props.error ?? '根拠候補が弱いため回答できません。'}</p>
        <p>質問を具体化するか、source cardだけを確認してください。</p>
      </div>
    )
  }

  if (props.status === 'error') {
    return (
      <div className="answer-box answer-box--error" role="alert">
        {props.error ?? 'mock回答生成に失敗しました。'}
      </div>
    )
  }

  if (props.status === 'aborted') {
    return <div className="answer-box answer-box--muted">mock回答生成を中断しました。</div>
  }

  return (
    <div className="answer-box" aria-busy={props.status === 'streaming'}>
      <p>
        <AnswerTextWithCitations
          onSourceReference={props.onSourceReference}
          response={props.response}
          text={props.text}
        />
      </p>
      {props.status === 'streaming' ? <span className="streaming-cursor" aria-hidden="true" /> : null}
    </div>
  )
}

function AnswerTextWithCitations(props: {
  onSourceReference: (sourceId: string) => void
  response: SearchResponse | null
  text: string
}) {
  if (!props.text.includes('[')) {
    return props.text
  }

  const validSourceIds = new Set(props.response?.results.map((result) => result.sourceId) ?? [])
  const parts = props.text.split(/(\[\d+\])/g)

  return (
    <>
      {parts.map((part, index) => {
        const match = /^\[(\d+)\]$/.exec(part)

        if (!match) {
          return <span key={`${part}-${index}`}>{part}</span>
        }

        const sourceId = match[1]

        if (!validSourceIds.has(sourceId)) {
          return <span key={`${part}-${index}`}>{part}</span>
        }

        return (
          <button
            className="citation-button"
            key={`${part}-${index}`}
            onClick={() => props.onSourceReference(sourceId)}
            type="button"
          >
            {part}
          </button>
        )
      })}
    </>
  )
}

function SourceCards(props: {
  response: SearchResponse | null
  sourceCardRefs: MutableRefObject<Record<string, HTMLLIElement | null>>
}) {
  if (!props.response || props.response.results.length === 0) {
    return <p>表示できる根拠候補はありません。</p>
  }

  return (
    <ol className="source-list" aria-label="根拠候補">
      {props.response.results.map((result) => (
        <li
          className="source-card"
          key={result.chunkId}
          ref={(element) => {
            props.sourceCardRefs.current[result.sourceId] = element
          }}
          tabIndex={-1}
        >
          <div className="source-card__header">
            <span className="source-card__id">Source {result.sourceId}</span>
            <span className="tag">{result.category}</span>
          </div>
          <h4>{result.documentTitle}</h4>
          <p className="source-card__path">{result.headingPath.join(' / ')}</p>
          <p>{result.excerpt}</p>
          <details>
            <summary>developer details</summary>
            <dl>
              <div>
                <dt>chunk id</dt>
                <dd>{result.chunkId}</dd>
              </div>
              <div>
                <dt>score</dt>
                <dd>{result.score}</dd>
              </div>
            </dl>
          </details>
        </li>
      ))}
    </ol>
  )
}

function toSearchUiError(error: unknown): SearchUiError {
  if (error instanceof SearchApiError) {
    return {
      code: error.code,
      message: error.message
    }
  }

  return {
    code: 'unknown_error',
    message: '検索に失敗しました。'
  }
}
