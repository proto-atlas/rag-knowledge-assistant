# Deployment Sanity Evidence

Generated at: 2026-05-02T08:24:00Z
Check type: post-deploy public route sanity
Result: pass

## Scope

This evidence records a small post-deploy sanity check for the mock-only public deployment.

- Public URL: `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- Deployed Worker version ID: `5f9ba783-b039-4c07-976c-56d4f9605a91`
- App code commit checked before deploy: `de9588f`
- Live provider mode: not enabled
- Claude live call: not run
- Access key recorded: no

## Checks

| Check | Expected | Observed |
|---|---|---|
| `GET /api/health` | 200 | 200, `{"ok":true,"service":"rag-knowledge-assistant"}` |
| `GET /` | 200 | 200, HTML contains `RAG Knowledge Assistant` and `mock-only` |
| unauthenticated `POST /api/search` | 401 | 401, `unauthorized` |

## Method

Commands were run from a local Node.js HTTPS client after `wrangler deploy`.

PowerShell `Invoke-WebRequest` and Windows `curl.exe` failed in the local environment with a Schannel credential error, so Node.js `fetch` was used for the public route sanity checks.

## Not Claimed

- This does not test authenticated search or ask flows.
- This does not call Workers AI, Vectorize, D1, or Claude through the public route.
- This does not prove live provider-mode retrieval or answer quality.
- This does not replace the full mock-only deployment smoke evidence at `deployment-smoke-2026-05-01.md`.
