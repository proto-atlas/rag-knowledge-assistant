# Deployment Readiness Evidence

Generated at: 2026-05-01T09:48:44+09:00
Generated from: local worktree
Check type: deployment readiness documentation
Result: partial pass

This evidence records deployment instructions and configuration boundaries.
It does not deploy the Worker.

## Scope

Added files:

- `docs/DEPLOYMENT.md`

Updated files:

- `docs/PROVIDER-BINDINGS.md`
- `README.md`
- `docs/REVIEWER.md`

## Behavior

Deployment instructions now separate:

- normal portfolio deployment
- manual live provider smoke deployment

Normal portfolio deployment keeps live Claude generation disabled by default.

Manual live provider smoke requires:

- explicit cost approval
- `RAG_ANTHROPIC_API_KEY`
- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL`

## Provider Secret Naming

Provider secret naming is `RAG_ANTHROPIC_API_KEY`.
The implementation reads this project-scoped secret name.

## Verification

Documentation-only update.

## Not Claimed

- No Cloudflare deploy was run.
- No Anthropic secret was configured.
- No live Claude API call was made.
- No deployed public URL was verified.
