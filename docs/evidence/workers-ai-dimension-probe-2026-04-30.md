# Workers AI Dimension Probe Evidence

Generated at: 2026-04-30T22:29:44.7288435+09:00
Generated from: local worktree
Check type: manual Workers AI embedding dimension probe
Result: pass

This file records a one-request Workers AI embedding dimension probe.
It confirms the embedding output shape for `@cf/baai/bge-m3` at the time shown below.

No raw embedding vector, Cloudflare token, account secret, cookie, or local-only internal note is included.

Not claimed:

- No Vectorize query was run.
- No Vectorize upsert was run.
- No D1 migration was run.
- No Claude API call was run.
- No Cloudflare deploy was run.

## Why This Probe Exists

Current local Wrangler help does not list `@cf/baai/bge-m3` as a `vectorize create --preset` choice.
Before creating a Vectorize index for `@cf/baai/bge-m3`, the embedding dimension must be confirmed with a controlled probe and recorded as evidence.

## Probe Command

This command is intentionally not part of normal CI.
It refuses to run unless the live confirmation flag is supplied.

```bash
corepack pnpm run probe:workers-ai-dimension -- --confirm-live-workers-ai-probe
```

Required environment variables:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The script sends one short text value to `@cf/baai/bge-m3` and prints only:

- generated timestamp
- model id
- embedding dimension
- optional shape
- optional pooling

It does not print the raw embedding vector.

## Evidence Recorded

```text
Attempt 1: 2026-04-30
Command: corepack pnpm run probe:workers-ai-dimension -- --confirm-live-workers-ai-probe
Result: not executed against Workers AI
Reason: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN were not present in the command environment.
Live API call: no
Raw embedding vector copied: no

Attempt 2: 2026-04-30T13:10:05.625Z
Command: corepack pnpm run probe:workers-ai-dimension -- --confirm-live-workers-ai-probe
Result: pass
Model: @cf/baai/bge-m3
Dimensions: 1024
Shape: [1, 1024]
Pooling: cls
Raw embedding vector copied: no
```

## Pass Criteria

- Probe runs exactly once for this setup step.
- Output includes `model`.
- Output includes finite positive `dimensions`.
- Raw embedding vector is not copied into evidence.
- Cloudflare token, account secrets, cookies, or local-only internal notes are not copied into evidence.

## Follow-Up

After dimension was confirmed:

1. Use `cosine` as the planned Vectorize metric for `@cf/baai/bge-m3`, based on Cloudflare AI Search supported-model docs.
2. Create `rag-bge-m3-v1` with explicit `--dimensions` and `--metric`: completed.
3. Record Vectorize index info in `docs/evidence/vectorize-index-setup-2026-04-30.md`: completed.
