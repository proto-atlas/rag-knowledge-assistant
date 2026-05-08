# Provider Retrieval Eval Evidence

## 日本語要約

このevidenceは、guardされたprovider-modeの`/api/search`経路を対象にした、小規模retrieval-only検証のpoint-in-timeログです。

- 確認したこと: 25件の架空fixtureでWorkers AI + Vectorize + D1経路が期待chunkを返すか
- 結果: hit@1 / hit@3 / hit@5 / MRR / no-answer accuracy はすべて1.000
- 読み方: provider retrieval pathの接続とscore gateの挙動確認であり、held-out external benchmarkではありません
- このログで主張しないこと: Claude回答品質、production RAG品質、大規模corpusでの検索品質、公開provider-mode動作

別ログとして、Mr. TyDi Japanese dev subsetに対するlocal lexical baselineを `external-benchmark-eval-2026-05-03.md` に記録しています。この25 fixture evalの満点指標と外部subset baselineは、評価対象も検索経路も違うため直接比較しません。

詳細なmetric名、score分布、raw distribution dataは、証拠性と再現性を保つため英語表記のまま残しています。

Generated at: 2026-05-02T07:43:41.046Z
Check type: provider-retrieval-eval
Result: pass

This evidence calls the guarded `/api/search` route against a provider-mode target and records retrieval-only metrics. It does not call Claude or generate answers.

## Scope

- Target base URL: http://127.0.0.1:8796
- Fixture count: 25
- Answerable fixtures: 20
- No-answer fixtures: 5
- topK: 5
- Provider score gate: code default MIN_PROVIDER_VECTOR_SCORE=0.55
- Access key recorded: no

## Summary

| Metric | Value |
|---|---:|
| hit@1 | 1.000 |
| hit@3 | 1.000 |
| hit@5 | 1.000 |
| MRR | 1.000 |
| no-answer accuracy | 1.000 |

## Score Separation

| Score group | Value |
|---|---:|
| Minimum answerable top score | 0.5793 |
| Maximum no-answer top score | 0.5119 |
| Separation margin | 0.0674 |
| Margin above max no-answer at 0.55 | 0.0381 |
| Margin below min answerable at 0.55 | 0.0293 |

## Score Distribution

| Group | n | min | p25 | p50 | p75 | max |
|---|---:|---:|---:|---:|---:|---:|
| answerable | 20 | 0.5793 | 0.6509 | 0.6912 | 0.7288 | 0.7702 |

No-answer group has only five fixtures, so this evidence lists raw sorted top scores instead of quartiles:

`0.3622`, `0.3794`, `0.4887`, `0.5043`, `0.5119`

## Threshold Calibration Sensitivity

The default threshold is calibrated for this 25-fixture portfolio corpus. It is not a general Vectorize score invariant and must be rechecked if the corpus, chunking strategy, embedding model, index version, or Vectorize metric changes.

| Threshold | Answerable retained | No-answer retained |
|---:|---:|---:|
| 0.500 | 20/20 | 3/5 |
| 0.525 | 20/20 | 5/5 |
| 0.550 | 20/20 | 5/5 |
| 0.575 | 20/20 | 5/5 |
| 0.600 | 19/20 | 5/5 |

## Failed Cases

- None.

## Per-Fixture Results

| ID | Type | First expected rank | No-answer recommended | Top score | Expected chunks | Top actual chunks |
|---|---|---:|---|---:|---|---|
| ret-001 | answerable | 1 | no | 0.7342 | remote-work-policy__s1__c1 | remote-work-policy__s1__c1, remote-work-policy__s3__c1, expense-policy__s2__c1, incident-response__s3__c1, product-faq__s3__c1 |
| ret-002 | answerable | 1 | no | 0.6394 | remote-work-policy__s2__c1 | remote-work-policy__s2__c1, security-handbook__s3__c1, security-handbook__s2__c1, remote-work-policy__s1__c1, release-process__s1__c1 |
| ret-003 | answerable | 1 | no | 0.6737 | remote-work-policy__s3__c1 | remote-work-policy__s3__c1, remote-work-policy__s1__c1, incident-response__s1__c1, security-handbook__s2__c1, incident-response__s3__c1 |
| ret-004 | answerable | 1 | no | 0.6548 | expense-policy__s2__c1 | expense-policy__s2__c1, expense-policy__s1__c1, expense-policy__s3__c1, onboarding-guide__s1__c1, security-handbook__s1__c1 |
| ret-005 | answerable | 1 | no | 0.6135 | expense-policy__s3__c1 | expense-policy__s3__c1, expense-policy__s1__c1, expense-policy__s2__c1, support-escalation__s1__c1, release-process__s3__c1 |
| ret-006 | answerable | 1 | no | 0.6881 | security-handbook__s1__c1 | security-handbook__s1__c1, remote-work-policy__s2__c1, onboarding-guide__s1__c1, security-handbook__s2__c1, incident-response__s1__c1 |
| ret-007 | answerable | 1 | no | 0.6688 | security-handbook__s2__c1 | security-handbook__s2__c1, incident-response__s1__c1, product-faq__s3__c1, support-escalation__s3__c1, incident-response__s3__c1 |
| ret-008 | answerable | 1 | no | 0.6943 | security-handbook__s3__c1 | security-handbook__s3__c1, remote-work-policy__s2__c1, release-process__s1__c1, release-process__s2__c1, incident-response__s2__c1 |
| ret-009 | answerable | 1 | no | 0.7620 | incident-response__s1__c1 | incident-response__s1__c1, product-faq__s3__c1, onboarding-guide__s1__c1, incident-response__s3__c1, security-handbook__s2__c1 |
| ret-010 | answerable | 1 | no | 0.6312 | incident-response__s2__c1 | incident-response__s2__c1, security-handbook__s3__c1, security-handbook__s2__c1, incident-response__s1__c1, remote-work-policy__s2__c1 |
| ret-011 | answerable | 1 | no | 0.6649 | incident-response__s3__c1 | incident-response__s3__c1, support-escalation__s3__c1, remote-work-policy__s1__c1, onboarding-guide__s2__c1, onboarding-guide__s1__c1 |
| ret-012 | answerable | 1 | no | 0.7261 | onboarding-guide__s1__c1 | onboarding-guide__s1__c1, security-handbook__s1__c1, onboarding-guide__s2__c1, expense-policy__s2__c1, remote-work-policy__s1__c1 |
| ret-013 | answerable | 1 | no | 0.7271 | onboarding-guide__s2__c1 | onboarding-guide__s2__c1, onboarding-guide__s1__c1, onboarding-guide__s3__c1, expense-policy__s2__c1, incident-response__s3__c1 |
| ret-014 | answerable | 1 | no | 0.5793 | product-faq__s1__c1 | product-faq__s1__c1, product-faq__s2__c1, expense-policy__s1__c1, expense-policy__s2__c1, onboarding-guide__s1__c1 |
| ret-015 | answerable | 1 | no | 0.7702 | product-faq__s2__c1 | product-faq__s2__c1, incident-response__s3__c1, onboarding-guide__s2__c1, onboarding-guide__s3__c1, expense-policy__s2__c1 |
| ret-016 | answerable | 1 | no | 0.6290 | product-faq__s3__c1 | product-faq__s3__c1, onboarding-guide__s2__c1, incident-response__s2__c1, release-process__s3__c1, onboarding-guide__s3__c1 |
| ret-017 | answerable | 1 | no | 0.7632 | support-escalation__s1__c1 | support-escalation__s1__c1, support-escalation__s3__c1, remote-work-policy__s3__c1, onboarding-guide__s3__c1, incident-response__s1__c1 |
| ret-018 | answerable | 1 | no | 0.7150 | support-escalation__s2__c1 | support-escalation__s2__c1, expense-policy__s2__c1, release-process__s2__c1, onboarding-guide__s1__c1, product-faq__s3__c1 |
| ret-019 | answerable | 1 | no | 0.7405 | release-process__s1__c1 | release-process__s1__c1, security-handbook__s3__c1, release-process__s2__c1, release-process__s3__c1, onboarding-guide__s3__c1 |
| ret-020 | answerable | 1 | no | 0.7224 | release-process__s3__c1 | release-process__s3__c1, release-process__s2__c1, release-process__s1__c1, incident-response__s2__c1, support-escalation__s2__c1 |
| no-001 | no-answer | - | yes | 0.3794 | - | onboarding-guide__s3__c1, onboarding-guide__s2__c1, onboarding-guide__s1__c1, remote-work-policy__s1__c1, security-handbook__s1__c1 |
| no-002 | no-answer | - | yes | 0.5119 | - | onboarding-guide__s1__c1, expense-policy__s2__c1, remote-work-policy__s1__c1, product-faq__s1__c1, remote-work-policy__s3__c1 |
| no-003 | no-answer | - | yes | 0.4887 | - | expense-policy__s3__c1, expense-policy__s2__c1, expense-policy__s1__c1, product-faq__s1__c1, onboarding-guide__s1__c1 |
| no-004 | no-answer | - | yes | 0.5043 | - | expense-policy__s3__c1, incident-response__s3__c1, product-faq__s2__c1, support-escalation__s1__c1, security-handbook__s2__c1 |
| no-005 | no-answer | - | yes | 0.3622 | - | remote-work-policy__s2__c1, security-handbook__s1__c1, security-handbook__s2__c1, remote-work-policy__s1__c1, onboarding-guide__s1__c1 |

## Not Claimed

- This is not Claude answer quality.
- This is not claim-level factuality validation.
- This is not a large-corpus benchmark.
- This does not prove production authentication or rate limiting.
- The 25 fictional fixtures were authored alongside the retrieval scaffold within the same project. They are not a held-out external benchmark. Perfect or near-perfect scores reflect scaffold-fixture co-design, not generalization.

## Raw Distribution Data

```json
{
  "scoreDistribution": {
    "answerable": {
      "n": 20,
      "min": 0.5792542,
      "p25": 0.6509442249999999,
      "p50": 0.691210895,
      "p75": 0.7288335475,
      "max": 0.7702456
    },
    "noAnswer": {
      "n": 5,
      "sortedValues": [
        0.36220714,
        0.37944838,
        0.4886515,
        0.50431925,
        0.51189995
      ]
    }
  },
  "thresholdSensitivity": [
    {
      "threshold": 0.5,
      "answerableRetained": 20,
      "noAnswerRetained": 3
    },
    {
      "threshold": 0.525,
      "answerableRetained": 20,
      "noAnswerRetained": 5
    },
    {
      "threshold": 0.55,
      "answerableRetained": 20,
      "noAnswerRetained": 5
    },
    {
      "threshold": 0.575,
      "answerableRetained": 20,
      "noAnswerRetained": 5
    },
    {
      "threshold": 0.6,
      "answerableRetained": 19,
      "noAnswerRetained": 5
    }
  ]
}
```
