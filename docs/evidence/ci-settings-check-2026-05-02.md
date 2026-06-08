# CI設定確認記録

生成日時: 2026-05-02
確認環境: ローカル実行
確認種別: GitHub Actions品質workflow設定確認
結果: remote runは成功

## 日本語要約

この記録は、GitHub Actionsの品質ゲートを安全寄りにするための特定時点記録です。

- 確認したこと: concurrency、最小permissions、E2E失敗artifact保存、third-party actionのfull SHA pin。
- 結果: local quality gateとremote Actions runがpassし、2026-05-03に主要4 actionを公式tag由来のfull SHAへpinしました。
- 読み方: 公開URLで使うCI設定の確認記録です。GitHub Actions運用全体の完全なsupply-chain保証ではありません。
- この記録に含めない範囲: Dependabot PRの実発生、artifact attestation、全third-party supply-chain riskの排除は主張しません。

## 対象

この記録では、公開品質確認workflowの設定変更を残す。

変更内容:

- 同じrefの古いrunを取り消すため、workflow-levelの `concurrency` を追加した。
- repository default permissionに依存しないよう、workflow-levelの `permissions: contents: read` を追加した。
- Playwright失敗時に `playwright-report/` と `test-results/` をartifactへ保存する設定を追加した。
- READMEへquality gate badgeを追加した。
- 主要third-party actionsを、公式tagから確認したfull commit SHAへpinしました。
- `github-actions` ecosystem向けのDependabot version updatesを追加しました。

## 2026-05-03 SHA Pinning Update

workflowは、主要third-party actionsをmutable tag参照だけでは使わず、公式upstream repositoryを `git ls-remote` で確認したfull SHAへpinしています。

| Action | 以前の参照 | pinしたSHA | 公式repo | 確認 |
|---|---|---|---|---|
| `actions/checkout` | `v6` | `de0fac2e4500dabe0009e67214ff5f5447ce83dd` | `https://github.com/actions/checkout.git` | `refs/tags/v6` |
| `pnpm/action-setup` | `v6` | `26f6d4f2c533a43e6b5da0b4a5dd983f98f7b49a` | `https://github.com/pnpm/action-setup.git` | `refs/tags/v6^{}` from annotated tag object `cb9c4fdd700176d874d52d64ce3b7418842cf6d3` |
| `actions/setup-node` | `v6` | `48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` | `https://github.com/actions/setup-node.git` | `refs/tags/v6` |
| `actions/upload-artifact` | `v4` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | `https://github.com/actions/upload-artifact.git` | `refs/tags/v4` |

repository rootに `package-ecosystem: github-actions` のDependabot設定を追加しました。これは将来のaction更新経路を記録するものであり、Dependabot PRがすでに生成されたとは主張しません。

## 確認

同じ設定確認で実行したローカルコマンド:

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test
corepack pnpm run build
corepack pnpm run build:worker
corepack pnpm run test:e2e
git diff --check
```

観測結果:

- TypeScript typecheck: 通過。
- Lint: 通過。
- Vitest全体の対象ファイル: 38件通過。
- Vitest全体のテスト: 173件通過。
- Production build: 通過。
- Worker dry-run build: 通過。
- E2E tests: 9 passed.
- Git diff whitespace check: 通過。line-ending warningのみ。

リモート確認:

- GitHub Actions workflow: `品質ゲート`
- Run: `25254600848`
- Head commit: `6e5df3629209a58369ff9f0474c0af1e16bf85b3`
- 結果: 成功
- Job: `検証` completed in 1m 9s

## この記録に含めない範囲

- SHA固定後にDependabotが更新PRを作成または検証したことは主張しません。
- artifact attestationsは追加していません。
- preview deploymentは追加していません。
- 手動確認の特定時点記録を毎回のCIに組み込むものではありません。
