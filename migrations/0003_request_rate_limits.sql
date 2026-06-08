CREATE TABLE IF NOT EXISTS request_rate_limits (
  client_key_hash TEXT NOT NULL,
  route TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (client_key_hash, route, window_start)
);

CREATE INDEX IF NOT EXISTS idx_request_rate_limits_window_start ON request_rate_limits (window_start);
