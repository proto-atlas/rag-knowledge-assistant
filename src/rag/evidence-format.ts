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

  return `# Retrieval Eval Evidence

Generated at: ${generatedAt}
Check type: mock retrieval eval
Method: runRetrievalEval() against the fixed fictional corpus
External calls: none

## Scope

This evidence checks the local retrieval fixture set before connecting Workers AI or Vectorize.
It is not a claim that the later production Vectorize index has the same quality.

## Fixture Summary

| Type | Count |
|---|---:|
| Answerable questions | ${answerableCount} |
| No-answer questions | ${noAnswerCount} |
| Total | ${fixtures.length} |

## Acceptance Target

| Metric | Target | Actual |
|---|---:|---:|
| hit@5 | >= 0.800 | ${formatMetric(result.hitAt5)} |
| no-answer accuracy | >= 0.800 | ${formatMetric(result.noAnswerAccuracy)} |
| failed cases | 0 | ${result.failedCases.length} |

MRR is recorded as a diagnostic metric. It is not a hard gate for this small fixture set.

## Result

| Metric | Value |
|---|---:|
| hit@1 | ${formatMetric(result.hitAt1)} |
| hit@3 | ${formatMetric(result.hitAt3)} |
| hit@5 | ${formatMetric(result.hitAt5)} |
| MRR | ${formatMetric(result.mrr)} |
| no-answer accuracy | ${formatMetric(result.noAnswerAccuracy)} |

## Failed Cases

| ID | Reason | Expected chunks | Actual chunks | Question |
|---|---|---|---|---|
${failedCaseRows}

## Notes

- The corpus uses fictional documents only.
- This run does not call Claude, Workers AI, Vectorize, D1, or Cloudflare.
- The mock scorer is a development scaffold, not the final retrieval implementation.
- Real Vectorize evaluation must be recorded separately after the index is created.
`
}

export function createRetrievalEvalJson(payload: RetrievalEvidencePayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`
}

function formatMetric(value: number): string {
  return value.toFixed(3)
}
