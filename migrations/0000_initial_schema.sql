CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,
  last_heartbeat INTEGER,
  next_expected_run INTEGER,
  grace_minutes INTEGER DEFAULT 15,
  is_monitored INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE heartbeats (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  runtime INTEGER,
  status TEXT DEFAULT 'success',
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE sync_logs (
  id TEXT PRIMARY KEY,
  synced_at INTEGER NOT NULL,
  source_ip TEXT,
  job_count INTEGER
);

CREATE INDEX idx_jobs_name ON jobs(name);
CREATE INDEX idx_heartbeats_job_id ON heartbeats(job_id);
CREATE INDEX idx_heartbeats_received_at ON heartbeats(received_at);
