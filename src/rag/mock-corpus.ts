import { FIXTURE_INDEX_VERSION } from '../shared/fixture-index-summary'
import type { SearchCorpusChunk } from './search-types'

export const mockSearchCorpus: SearchCorpusChunk[] = [
  {
    chunkId: 'remote-work-policy__s1__c1',
    documentSlug: 'remote-work-policy',
    documentTitle: 'リモート勤務規程',
    category: 'policy',
    tags: ['policy', 'remote', 'attendance'],
    headingPath: ['対象と申請'],
    content:
      'リモート勤務は前営業日の十八時までに勤務予定をチームカレンダーへ登録します。急な体調不良や交通障害の場合は、当日の朝九時三十分までにチームリードへ連絡すれば例外として当日申請できます。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'remote-work-policy__s2__c1',
    documentSlug: 'remote-work-policy',
    documentTitle: 'リモート勤務規程',
    category: 'policy',
    tags: ['policy', 'remote', 'vpn'],
    headingPath: ['作業環境'],
    content:
      '自宅以外の場所で作業する場合は画面が見えない席を選び、会社管理端末と多要素認証を利用します。公共Wi-Fiでは社内VPNを有効にしてから業務システムへ接続します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'remote-work-policy__s3__c1',
    documentSlug: 'remote-work-policy',
    documentTitle: 'リモート勤務規程',
    category: 'policy',
    tags: ['policy', 'remote', 'communication'],
    headingPath: ['連絡ルール'],
    content:
      '勤務中はチャットのステータスを更新します。離席が三十分を超える場合は理由と戻り予定時刻を共有し、緊急連絡はチャットの緊急チャンネルを使います。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'expense-policy__s1__c1',
    documentSlug: 'expense-policy',
    documentTitle: '経費精算ガイド',
    category: 'finance',
    tags: ['finance', 'expense', 'approval'],
    headingPath: ['精算対象'],
    content:
      '経費精算の対象は、業務に必要な交通費、クラウド検証用の少額利用料、開発備品、書籍、セミナー参加費です。個人利用と混在する支出は業務利用分を説明できる場合に限ります。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'expense-policy__s2__c1',
    documentSlug: 'expense-policy',
    documentTitle: '経費精算ガイド',
    category: 'finance',
    tags: ['finance', 'expense', 'approval'],
    headingPath: ['申請フロー'],
    content:
      '申請者は領収書、利用目的、関連プロジェクト、税区分を経費システムへ登録します。五万円未満はチームリード承認、五万円以上は部門責任者承認が必要です。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'expense-policy__s3__c1',
    documentSlug: 'expense-policy',
    documentTitle: '経費精算ガイド',
    category: 'finance',
    tags: ['finance', 'expense', 'compliance'],
    headingPath: ['禁止事項'],
    content:
      '私的なサブスクリプション、家族の交通費、業務と関係のない備品は精算できません。領収書の金額や日付を加工した場合は申請を却下します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'security-handbook__s1__c1',
    documentSlug: 'security-handbook',
    documentTitle: 'セキュリティハンドブック',
    category: 'security',
    tags: ['security', 'account', 'mfa'],
    headingPath: ['アカウント管理'],
    content:
      '社内アカウントには多要素認証を必ず設定します。パスワードは他サービスで使い回さず、会社指定のパスワードマネージャーで管理します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'security-handbook__s2__c1',
    documentSlug: 'security-handbook',
    documentTitle: 'セキュリティハンドブック',
    category: 'security',
    tags: ['security', 'device', 'loss'],
    headingPath: ['端末管理'],
    content:
      '業務端末にはディスク暗号化、画面ロック、OS自動更新を有効にします。紛失した場合は発覚から一時間以内にセキュリティ担当とチームリードへ連絡します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'security-handbook__s3__c1',
    documentSlug: 'security-handbook',
    documentTitle: 'セキュリティハンドブック',
    category: 'security',
    tags: ['security', 'sharing', 'repository'],
    headingPath: ['外部共有'],
    content:
      '顧客資料、設計書、ログ、スクリーンショットを外部へ共有する場合は共有範囲と有効期限を設定します。公開リポジトリへコードを置く前にはsecret scanとリリースチェックを実行します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'incident-response__s1__c1',
    documentSlug: 'incident-response',
    documentTitle: 'インシデント対応手順',
    category: 'incident',
    tags: ['incident', 'security', 'reporting'],
    headingPath: ['初動'],
    content:
      '不審なログイン通知、顧客データの誤送信、公開リポジトリへのsecret混入、障害による顧客影響を発見した場合は、十五分以内にインシデントチャンネルへ報告します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'incident-response__s2__c1',
    documentSlug: 'incident-response',
    documentTitle: 'インシデント対応手順',
    category: 'incident',
    tags: ['incident', 'containment', 'rotation'],
    headingPath: ['封じ込め'],
    content:
      'secret漏えいが疑われる場合は該当キーをローテーションし、関連ログを保存します。公開範囲の誤設定がある場合は共有リンクを停止し、アクセスログを確認します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'incident-response__s3__c1',
    documentSlug: 'incident-response',
    documentTitle: 'インシデント対応手順',
    category: 'incident',
    tags: ['incident', 'postmortem', 'prevention'],
    headingPath: ['事後対応'],
    content:
      '復旧後二営業日以内に、原因、検知経路、影響、再発防止策、担当者、期限を含むポストモーテムを作成します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'onboarding-guide__s1__c1',
    documentSlug: 'onboarding-guide',
    documentTitle: 'オンボーディングガイド',
    category: 'onboarding',
    tags: ['onboarding', 'setup', 'mfa'],
    headingPath: ['初日の準備'],
    content:
      '入社初日は、アカウント発行、端末確認、多要素認証設定、チャット参加、勤怠システム確認を行います。メンターは導入ミーティングを設定します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'onboarding-guide__s2__c1',
    documentSlug: 'onboarding-guide',
    documentTitle: 'オンボーディングガイド',
    category: 'onboarding',
    tags: ['onboarding', 'review', 'first-week'],
    headingPath: ['最初の一週間'],
    content:
      '一週間目は、小さなドキュメント修正、テスト追加、既存不具合の再現確認など影響範囲の小さいタスクから始めます。十五分以上詰まったらメンターへ相談します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'onboarding-guide__s3__c1',
    documentSlug: 'onboarding-guide',
    documentTitle: 'オンボーディングガイド',
    category: 'onboarding',
    tags: ['onboarding', 'team', 'docs'],
    headingPath: ['チーム理解'],
    content:
      '二週間目までに、主要ユーザー、問い合わせ経路、リリース手順、障害時の連絡先を確認します。仕様理解はREADME、設計メモ、テスト、最近のプルリクエストを合わせて読みます。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'product-faq__s1__c1',
    documentSlug: 'product-faq',
    documentTitle: '製品FAQ',
    category: 'product',
    tags: ['product', 'faq', 'plan'],
    headingPath: ['プラン'],
    content:
      'Northstar DeskにはStarter、Team、Businessの三つのプランがあります。Businessは監査ログ、優先サポート、詳細な権限管理を含みます。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'product-faq__s2__c1',
    documentSlug: 'product-faq',
    documentTitle: '製品FAQ',
    category: 'product',
    tags: ['product', 'retention', 'audit-log'],
    headingPath: ['データ保持'],
    content:
      '削除されたプロジェクトは三十日間の復元期間を経て完全削除されます。監査ログはBusinessプランで一年間保持されます。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'product-faq__s3__c1',
    documentSlug: 'product-faq',
    documentTitle: '製品FAQ',
    category: 'product',
    tags: ['product', 'notification', 'webhook'],
    headingPath: ['通知'],
    content:
      '通知はメール、アプリ内通知、Webhookで受け取れます。WebhookはTeam以上で利用でき、送信失敗時は最大三回まで再試行されます。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'support-escalation__s1__c1',
    documentSlug: 'support-escalation',
    documentTitle: 'サポートエスカレーション基準',
    category: 'support',
    tags: ['support', 'priority', 'customer'],
    headingPath: ['優先度'],
    content:
      '問い合わせの優先度は、顧客影響、再現性、回避策の有無で判断します。全顧客に影響するログイン不可やデータ消失の疑いは最優先です。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'support-escalation__s2__c1',
    documentSlug: 'support-escalation',
    documentTitle: 'サポートエスカレーション基準',
    category: 'support',
    tags: ['support', 'escalation', 'logs'],
    headingPath: ['開発チームへの引き継ぎ'],
    content:
      '開発チームへ引き継ぐ場合は、環境、操作手順、期待結果、実際の結果、発生時刻、ブラウザ、スクリーンショット、関連ログをまとめます。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'support-escalation__s3__c1',
    documentSlug: 'support-escalation',
    documentTitle: 'サポートエスカレーション基準',
    category: 'support',
    tags: ['support', 'communication', 'status'],
    headingPath: ['顧客連絡'],
    content:
      '調査中の連絡は、事実と次回連絡予定を中心に書きます。原因が未確定の段階で断定した説明をしません。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'release-process__s1__c1',
    documentSlug: 'release-process',
    documentTitle: 'リリース手順',
    category: 'release',
    tags: ['release', 'quality', 'test'],
    headingPath: ['リリース判定'],
    content:
      'リリース前には、typecheck、lint、unit test、E2E check、build、リリースチェックを実行します。失敗した項目がある場合は修正または延期判断を記録します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'release-process__s2__c1',
    documentSlug: 'release-process',
    documentTitle: 'リリース手順',
    category: 'release',
    tags: ['release', 'deploy', 'check'],
    headingPath: ['デプロイ'],
    content:
      'デプロイ担当者は、対象commit、環境、開始時刻、完了時刻、確認URLをリリースチャンネルへ共有します。デプロイ後は主要APIとエラー監視を確認します。',
    indexVersion: FIXTURE_INDEX_VERSION
  },
  {
    chunkId: 'release-process__s3__c1',
    documentSlug: 'release-process',
    documentTitle: 'リリース手順',
    category: 'release',
    tags: ['release', 'rollback', 'incident'],
    headingPath: ['ロールバック'],
    content:
      'ロールバック条件は、認証不能、主要APIの継続的失敗、データ整合性リスク、重大な表示崩れです。復旧後は原因と再発防止策を記録します。',
    indexVersion: FIXTURE_INDEX_VERSION
  }
]
