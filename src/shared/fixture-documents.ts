export type FixtureCategory =
  | 'policy'
  | 'finance'
  | 'security'
  | 'incident'
  | 'onboarding'
  | 'product'
  | 'support'
  | 'release'

export type FixtureDocumentSummary = {
  slug: string
  title: string
  category: FixtureCategory
  tags: string[]
  description: string
}

export const fixtureDocuments: FixtureDocumentSummary[] = [
  {
    slug: 'remote-work-policy',
    title: 'リモート勤務規程',
    category: 'policy',
    tags: ['policy', 'remote', 'attendance'],
    description: '架空企業におけるリモート勤務の申請、連絡、作業環境に関する社内規程。'
  },
  {
    slug: 'expense-policy',
    title: '経費精算ガイド',
    category: 'finance',
    tags: ['finance', 'expense', 'approval'],
    description: '交通費、備品購入、立替精算の承認フローをまとめた架空の経費ガイド。'
  },
  {
    slug: 'security-handbook',
    title: 'セキュリティハンドブック',
    category: 'security',
    tags: ['security', 'account', 'device'],
    description: 'アカウント、端末、外部共有に関する架空企業の基本セキュリティルール。'
  },
  {
    slug: 'incident-response',
    title: 'インシデント対応手順',
    category: 'incident',
    tags: ['incident', 'security', 'reporting'],
    description: '不審なログインや情報漏えい疑いがある場合の初動対応を定義した手順。'
  },
  {
    slug: 'onboarding-guide',
    title: 'オンボーディングガイド',
    category: 'onboarding',
    tags: ['onboarding', 'team', 'setup'],
    description: '入社初週の環境準備、チーム合流、ドキュメント確認の流れを整理したガイド。'
  },
  {
    slug: 'product-faq',
    title: '製品FAQ',
    category: 'product',
    tags: ['product', 'faq', 'plan'],
    description: '架空SaaSのプラン、データ保持、通知機能に関するよくある質問。'
  },
  {
    slug: 'support-escalation',
    title: 'サポートエスカレーション基準',
    category: 'support',
    tags: ['support', 'escalation', 'customer'],
    description: '問い合わせの優先度判定と、開発チームへ引き継ぐ条件をまとめた基準。'
  },
  {
    slug: 'release-process',
    title: 'リリース手順',
    category: 'release',
    tags: ['release', 'deploy', 'quality'],
    description: '小規模Webサービスのリリース判定、ロールバック、周知に関する架空手順。'
  }
]

export const fixtureCategories: FixtureCategory[] = [
  'policy',
  'finance',
  'security',
  'incident',
  'onboarding',
  'product',
  'support',
  'release'
]
