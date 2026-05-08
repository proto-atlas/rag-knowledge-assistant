DROP TABLE IF EXISTS chunks;

CREATE TABLE chunks (
  chunk_record_id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  index_run_id TEXT NOT NULL,
  index_version TEXT NOT NULL,
  chunk_order INTEGER NOT NULL,
  heading_path TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  estimated_token_count INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(document_id),
  FOREIGN KEY (index_run_id) REFERENCES index_runs(index_run_id),
  UNIQUE (chunk_id, index_version)
);

CREATE INDEX IF NOT EXISTS idx_chunks_active_version ON chunks (active, index_version);
CREATE INDEX IF NOT EXISTS idx_chunks_document_version ON chunks (document_id, index_version);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_id ON chunks (chunk_id);
