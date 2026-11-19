CREATE TABLE IF NOT EXISTS campaign_briefs (
  id UUID PRIMARY KEY,
  brief TEXT NOT NULL CHECK (length(trim(brief)) > 0),
  status TEXT NOT NULL DEFAULT 'brief_received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operations_jobs (
  id UUID PRIMARY KEY,
  request TEXT NOT NULL CHECK (length(trim(request)) > 0),
  status TEXT NOT NULL DEFAULT 'awaiting_approval',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operations_jobs_created_at_idx
  ON operations_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS campaign_briefs_created_at_idx
  ON campaign_briefs (created_at DESC);
