# UI Screenshot Evidence

Generated at: 2026-04-30
Check type: local UI screenshot capture
Method: `corepack pnpm run evidence:ui`
External calls: none

## Scope

This evidence captures the local Vite UI with a mocked `/api/search` response.
It does not call Claude, Workers AI, Vectorize, D1, or Cloudflare.

## Screenshots

| Screen | File | Notes |
|---|---|---|
| Public top | `docs/evidence/screenshots/ui-top-2026-04-30.png` | Fictional documents, RAG flow, index status, and retrieval eval summary. |
| Search and server-side mock SSE answer | `docs/evidence/screenshots/ui-search-answer-2026-04-30.png` | Mock `/api/search` response and mocked `/api/ask` SSE answer. |
| Citation focus | `docs/evidence/screenshots/ui-citation-focus-2026-04-30.png` | Answer citation button moves focus to the matching source card. |

## Notes

- The access key used in this capture is a local test value.
- The browser test verifies that the access key is not persisted to localStorage or sessionStorage.
- The screenshot spec now mocks `/api/ask` as an SSE response. It does not call Claude.
- This screenshot evidence is not proof of provider integration.
