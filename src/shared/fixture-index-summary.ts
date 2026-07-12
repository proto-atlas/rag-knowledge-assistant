import { fixtureDocuments } from './fixture-documents'

export const FIXTURE_DOCUMENT_COUNT = fixtureDocuments.length
export const FIXTURE_CHUNK_COUNT = 24
export const FIXTURE_INDEX_VERSION = 'fixture-corpus-v1'
/** 公開デモ向けの固定fixture日時。実プロバイダーの最終index時刻ではない。 */
export const FIXTURE_LAST_INDEXED_AT: string | null = '2026-04-30T00:00:00.000Z'
