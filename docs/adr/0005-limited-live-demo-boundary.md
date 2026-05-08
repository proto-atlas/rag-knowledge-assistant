# ADR 0005: Limited Live Demo Boundary

Status: accepted
Date: 2026-05-05

## 日本語要約

公開トップページは未認証で閲覧可能にし、dynamic searchとanswer generationだけをaccess keyで保護します。access key付き経路ではWorkers AI、Vectorize、D1、Anthropicを呼ぶ限定live demoとして動かします。

## Context

公開ポートフォリオでは、mock-only UIだけでなく実providerを通るRAG経路も確認できる方が、実装範囲を説明しやすいです。一方で、未認証の公開アクセスからprovider costが発生する構成にはしません。

## Decision

Current deployment config uses provider mode by default for guarded dynamic routes:

- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL=claude-sonnet-4-6`
- `RAG_ANTHROPIC_MAX_TOKENS=256`

The top page remains publicly visible without provider calls. `/api/search` and `/api/ask` require `RAG_ACCESS_KEY`, and the access key remains a portfolio cost guard, not production user authentication.

## Consequences

Benefits:

- Interview reviewers can verify the actual Workers AI / Vectorize / D1 / Anthropic path when given an access key.
- The public top page remains safe to open without triggering provider calls.
- The code keeps fail-closed behavior when Anthropic secret or required vars are missing.

Tradeoffs:

- Access key distribution must be managed carefully.
- This still does not provide production authentication, per-user quota, WAF, audit logs, or document-level ACL.
- Live answer behavior remains point-in-time evidence and does not prove general RAG quality.
