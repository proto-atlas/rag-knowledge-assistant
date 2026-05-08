# ADR 0003: Provider Mode Boundary

Status: superseded by ADR 0005
Date: 2026-05-02

## 日本語要約

当初は公開URLをmock-onlyデモとして維持し、provider modeを明示的なenv flagとaccess/admin keyの背後に置く方針でした。限定live demoへ進めるため、現在の公開方針はADR 0005で更新しています。ここでいうaccess keyはcost guardであり、production user authenticationではありません。

## Context

The public portfolio URL had to be safe to review without exposing unrestricted live provider traffic. Search-only RAG can still consume embedding and vector resources, and answer generation can consume model tokens.

## Decision

The historical decision was to keep the public default path mock-only, and place provider-mode behavior behind explicit environment flags and access keys.

Provider mode requires deliberate configuration:

- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1` for provider search
- `RAG_ANSWER_PROVIDER_MODE=anthropic` for Anthropic answers
- `RAG_ENABLE_ANTHROPIC_LIVE=true` for live Anthropic calls
- access/admin keys for guarded dynamic routes

The access key is a portfolio cost guard. It is not production user authentication.

## Consequences

Benefits:

- The public demo remains safe to open without provider cost.
- Provider readiness can be tested in small, deliberate smoke checks.
- The README can separate public-demo claims from provider-readiness claims.

Tradeoffs:

- The public URL is not a live RAG SaaS.
- Production use would need real user authentication, rate limits, audit logs, key rotation, and provider cost monitoring.
