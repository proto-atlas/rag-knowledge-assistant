import type { RetrievalEvalFixture, RetrievalEvalResult } from './retrieval-eval'

export type RetrievalEvidencePayload = {
  generatedAt: string
  result: RetrievalEvalResult
  fixtures: RetrievalEvalFixture[]
}

export function formatRetrievalEvalMarkdown(payload: RetrievalEvidencePayload): string {
  const { generatedAt, result, fixtures } = payload
  const answerableCount = fixtures.filter((fixture) => fixture.shouldAnswer).length
  const noAnswerCount = fixtures.length - answerableCount
  const failedCaseRows =
    result.failedCases.length === 0
      ? '| - | - | - | - | - |\n'
      : result.failedCases
          .map((failedCase) => {
            return `| ${failedCase.id} | ${failedCase.reason} | ${failedCase.expectedChunkIds.join('<br>')} | ${failedCase.actualChunkIds.join('<br>')} | ${failedCase.question} |`
          })
          .join('\n')

  return `# retrieval評価記録

生成日時: ${generatedAt}
確認種別: モック検索評価
方法: 固定fictional corpusに対してrunRetrievalEval()を実行
外部呼び出し: なし

## 対象

この記録では、Workers AIやVectorizeへ接続する前にlocal retrieval fixture setを確認した結果を残す。
後続のproduction Vectorize indexが同じ品質を持つ、という主張ではない。

## fixture集計

| Type | Count |
|---|---:|
| Answerable questions | ${answerableCount} |
| No-answer questions | ${noAnswerCount} |
| Total | ${fixtures.length} |

## acceptance target

| Metric | Target | Actual |
|---|---:|---:|
| hit@5 | >= 0.800 | ${formatMetric(result.hitAt5)} |
| no-answer accuracy | >= 0.800 | ${formatMetric(result.noAnswerAccuracy)} |
| failed cases | 0 | ${result.failedCases.length} |

MRRはdiagnostic metricとして記録する。この小さなfixture setではhard gateにしない。

## 結果

| Metric | Value |
|---|---:|
| hit@1 | ${formatMetric(result.hitAt1)} |
| hit@3 | ${formatMetric(result.hitAt3)} |
| hit@5 | ${formatMetric(result.hitAt5)} |
| MRR | ${formatMetric(result.mrr)} |
| no-answer accuracy | ${formatMetric(result.noAnswerAccuracy)} |

## 失敗case

| ID | Reason | Expected chunks | Actual chunks | Question |
|---|---|---|---|---|
${failedCaseRows}

## 補足

- corpusはfictional documentsのみを使う。
- この実行ではClaude、Workers AI、Vectorize、D1、Cloudflareを呼ばない。
- mock scorerはdevelopment scaffoldであり、最終的なretrieval implementationではない。
- 実Vectorize評価は、index作成後に別記録として残す。
`
}

export function createRetrievalEvalJson(payload: RetrievalEvidencePayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`
}

function formatMetric(value: number): string {
  return value.toFixed(3)
}
