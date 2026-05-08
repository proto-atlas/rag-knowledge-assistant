CREATE TABLE IF NOT EXISTS index_runs (
  index_run_id TEXT PRIMARY KEY,
  index_version TEXT NOT NULL UNIQUE,
  embedding_model TEXT NOT NULL,
  vectorize_index_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_code TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  active_index_version TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
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
CREATE INDEX IF NOT EXISTS idx_documents_active_index_version ON documents (active_index_version);
