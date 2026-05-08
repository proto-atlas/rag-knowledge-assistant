# CI Hardening Evidence

Generated at: 2026-05-02
Generated from: local public repository worktree
Check type: GitHub Actions quality workflow hardening
Result: remote run passed

## 日本語要約

このevidenceは、GitHub Actionsの品質ゲートを安全寄りにするためのpoint-in-time記録です。

- 確認したこと: concurrency、最小permissions、E2E失敗artifact保存、third-party actionのfull SHA pin。
- 結果: local quality gateとremote Actions runがpassし、2026-05-03に主要4 actionを公式tag由来のfull SHAへpinしました。
- 読み方: public portfolio用のCI hardening証跡です。GitHub Actions運用全体の完全なsupply-chain保証ではありません。
- このログで主張しないこと: Dependabot PRの実発生、artifact attestation、全third-party supply-chain riskの排除は主張しません。

## Scope

This evidence records configuration changes to the public quality workflow.

Changed:

- Added workflow-level `concurrency` so superseded runs on the same ref are cancelled.
- Added workflow-level `permissions: contents: read` to avoid relying on broader repository defaults.
- Added Playwright failure artifact upload for `playwright-report/` and `test-results/`.
- Added a quality-gate badge to the README.
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

## Verification

Local commands run in the same hardening pass:

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test
corepack pnpm run build
corepack pnpm run build:worker
corepack pnpm run test:e2e
git diff --check
```

Observed result:

- TypeScript typecheck: passed.
- Lint: passed.
- Full Vitest files: 38 passed.
- Full Vitest tests: 173 passed.
- Production build: passed.
- Worker dry-run build: passed.
- E2E tests: 9 passed.
- Git diff whitespace check: passed with line-ending warnings only.

Remote verification:

- GitHub Actions workflow: `品質ゲート`
- Run: `25254600848`
- Head commit: `6e5df3629209a58369ff9f0474c0af1e16bf85b3`
- Result: success
- Job: `検証` completed in 1m 9s

## Not Claimed

- This does not claim that Dependabot has already opened or validated an update PR after the SHA pinning change.
- This does not add artifact attestations.
- This does not add preview deployments.
- This does not make point-in-time manual evidence part of every CI run.
