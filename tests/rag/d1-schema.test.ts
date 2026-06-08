import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationSql = readFileSync(join(process.cwd(), 'migrations', '0001_initial.sql'), 'utf8')

describe('D1 migration schema', () => {
  it('documents chunks index_runsの3テーブルを作成する', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS index_runs')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS documents')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS chunks')
  })

  it('chunk本文と検索versionを管理する列を持つ', () => {
    expect(migrationSql).toContain('chunk_record_id TEXT PRIMARY KEY')
    expect(migrationSql).toContain('chunk_id TEXT NOT NULL')
    expect(migrationSql).toContain('content TEXT NOT NULL')
    expect(migrationSql).toContain('index_version TEXT NOT NULL')
    expect(migrationSql).toContain('active INTEGER NOT NULL DEFAULT 0')
    expect(migrationSql).toContain('UNIQUE (chunk_id, index_version)')
  })

  it('active indexVersion検索用のindexを持つ', () => {
    expect(migrationSql).toContain('idx_chunks_active_version')
  })
})
