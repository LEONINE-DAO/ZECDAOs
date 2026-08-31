-- Zcashorg coordinator schema v1

CREATE TABLE IF NOT EXISTS funds (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  fund_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  zns_name TEXT,
  network TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  on_chain_id TEXT,
  constitution_hash TEXT,
  constitution_text_uri TEXT,
  constitution_amended_at TIMESTAMPTZ,
  platform_charter_version TEXT DEFAULT '0.1.0-draft',
  gleyo_community_id TEXT,
  gleyo_community_url TEXT,
  gleyo_linked_at TIMESTAMPTZ,
  created_by_member_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_configs (
  fund_id TEXT PRIMARY KEY REFERENCES funds(id) ON DELETE CASCADE,
  quorum_percent SMALLINT NOT NULL DEFAULT 40,
  pass_threshold_percent SMALLINT NOT NULL DEFAULT 67,
  voting_period_secs INTEGER NOT NULL DEFAULT 604800,
  execution_delay_secs INTEGER NOT NULL DEFAULT 0,
  min_voters INTEGER,
  proposal_policy TEXT NOT NULL DEFAULT 'any_member',
  allow_abstain BOOLEAN NOT NULL DEFAULT TRUE,
  voting_power_mode TEXT NOT NULL DEFAULT 'one_member_one_vote'
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  shielded_ua TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  voting_power INTEGER NOT NULL DEFAULT 1,
  invited_by TEXT,
  on_chain_member_id TEXT,
  member_commitment TEXT,
  private_ordering_ack BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ,
  UNIQUE (fund_id, shielded_ua)
);

CREATE INDEX IF NOT EXISTS idx_members_fund ON members(fund_id);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by_member_id TEXT,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS treasury_meta (
  fund_id TEXT PRIMARY KEY REFERENCES funds(id) ON DELETE CASCADE,
  receive_ua TEXT,
  balance_zatoshis BIGINT NOT NULL DEFAULT 0,
  balance_source TEXT NOT NULL DEFAULT 'unconfigured',
  on_chain_treasury_ref TEXT,
  gleyo_allocated_zatoshis BIGINT NOT NULL DEFAULT 0,
  gleyo_deposit_ua TEXT,
  last_synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  proposal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by_member_id TEXT NOT NULL,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  execution_status TEXT NOT NULL DEFAULT 'not_applicable',
  payload JSONB NOT NULL DEFAULT '{}',
  on_chain_proposal_id TEXT,
  proposal_hash TEXT,
  tally JSONB
);

CREATE INDEX IF NOT EXISTS idx_proposals_fund ON proposals(fund_id);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  choice TEXT NOT NULL,
  weight INTEGER NOT NULL,
  attestation JSONB,
  zk_proof TEXT,
  on_chain_vote_id TEXT,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, member_id)
);

CREATE TABLE IF NOT EXISTS fund_events (
  id TEXT PRIMARY KEY,
  fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_member_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_events_fund ON fund_events(fund_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crosslink_policies (
  fund_id TEXT PRIMARY KEY REFERENCES funds(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  max_stake_percent SMALLINT,
  delegate_to TEXT,
  notes TEXT
);
