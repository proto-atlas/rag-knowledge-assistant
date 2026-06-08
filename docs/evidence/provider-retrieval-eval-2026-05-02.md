# 実プロバイダー検索評価記録

## 日本語要約

この記録は、guardされた実プロバイダー経路の`/api/search`経路を対象にした、小規模retrieval-only検証の特定時点ログです。

- 確認したこと: 25件の架空fixtureでWorkers AI + Vectorize + D1経路が期待chunkを返すか
- 結果: hit@1 / hit@3 / hit@5 / MRR / 回答しない判定の正解率はすべて1.000
- 読み方: 実プロバイダー検索経路の接続とスコア判定の挙動確認であり、未学習データを使った外部ベンチマークではありません
- この記録に含めない範囲: Claude回答品質、本番RAG品質、大規模corpusでの検索品質、公開URLでの実プロバイダー動作

別ログとして、Mr. TyDi Japanese dev subsetに対するlocal lexical baselineを `external-benchmark-eval-2026-05-03.md` に記録しています。この25 fixture evalの満点指標と外部subset baselineは、評価対象も検索経路も違うため直接比較しません。

詳細なmetric名、score分布、raw distribution dataは、証拠性と再現性を保つため英語表記のまま残しています。

生成日時: 2026-05-02T07:43:41.046Z
確認種別: 実プロバイダー検索評価
結果: 成功

この記録では、実プロバイダー経路targetに対してguarded `/api/search` routeを呼び、retrievalのみのmetricsを残す。Claude呼び出しや回答生成は行わない。

## 対象

- 対象base URL: http://127.0.0.1:8796
- Fixture count: 25
- Answerable fixtures: 20
- 回答しないfixture: 5件
- topK: 5
- Provider score gate: code default MIN_PROVIDER_VECTOR_SCORE=0.55
- 確認用キーの記録: なし

## 集計

| Metric | Value |
|---|---:|
| hit@1 | 1.000 |
| hit@3 | 1.000 |
| hit@5 | 1.000 |
| MRR | 1.000 |
| 回答しない判定の正解率 | 1.000 |

## score分離

| Score group | Value |
|---|---:|
| Minimum answerable top score | 0.5793 |
| 回答しないfixtureの最大top score | 0.5119 |
| Separation margin | 0.0674 |
| 0.55しきい値と回答しないfixture最大値の差 | 0.0381 |
| Margin below min answerable at 0.55 | 0.0293 |

## score分布

| Group | n | min | p25 | p50 | p75 | max |
|---|---:|---:|---:|---:|---:|---:|
| answerable | 20 | 0.5793 | 0.6509 | 0.6912 | 0.7288 | 0.7702 |

回答しないグループは5件だけなので、この記録では四分位数ではなく、並び替えたtop scoreをそのまま列挙します:

`0.3622`, `0.3794`, `0.4887`, `0.5043`, `0.5119`

## threshold校正の感度

default thresholdは、この25件の固定評価corpusに合わせた値。Vectorize scoreの一般的な不変条件ではないため、corpus、chunking strategy、embedding model、index version、Vectorize metricを変えた場合は再確認する。

| Threshold | Answerable retained | No-answer retained |
|---:|---:|---:|
| 0.500 | 20/20 | 3/5 |
| 0.525 | 20/20 | 5/5 |
| 0.550 | 20/20 | 5/5 |
| 0.575 | 20/20 | 5/5 |
| 0.600 | 19/20 | 5/5 |

## 失敗case

- なし。

## fixture別結果

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

## この記録に含めない範囲

- これはClaude回答品質の評価ではありません。
- これはclaim単位の事実性検証ではありません。
- これは大規模corpus benchmarkではありません。
- 本番利用者認証やrate limitingを証明するものではありません。
- 25件のfictional fixturesは、このプロジェクト内でretrieval scaffoldと並行して作成したものです。held-out external benchmarkではありません。満点に近いscoreは、scaffoldとfixtureの相性を反映しており、一般化性能を示すものではありません。

## raw distribution data

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
