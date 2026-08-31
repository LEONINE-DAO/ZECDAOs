/** Shared domain types for Zcashorg — portable across coordinator, contract, hybrid backends. */

export type Network = "mainnet" | "testnet";

export type FundType = "family" | "business" | "investment_club" | "community";

export type FundStatus = "active" | "archived";

export type MemberRole = "owner" | "admin" | "member" | "auditor" | "viewer";

export type MemberStatus = "pending" | "active" | "removed";

export type InviteStatus = "open" | "accepted" | "expired" | "revoked";

export type ProposalPolicy = "any_member" | "admins_only" | "owners_only";

export type VotingPowerMode = "one_member_one_vote";

export type ProposalType =
  | "general"
  | "spend_intent"
  | "member_add"
  | "member_remove"
  | "role_change"
  | "policy_change"
  | "treasury_address"
  | "crosslink_policy"
  | "constitution_amend"
  | "gleyo_link"
  | "gleyo_budget_allocate"
  | "gleyo_program_approve";

export type ProposalStatus =
  | "draft"
  | "active"
  | "passed"
  | "rejected"
  | "expired"
  | "cancelled"
  | "executed";

export type ExecutionStatus =
  | "not_applicable"
  | "pending"
  | "completed"
  | "failed";

export type VoteChoice = "yes" | "no" | "abstain";

export type BalanceSource =
  | "manual"
  | "indexer"
  | "contract"
  | "unconfigured";

export interface Fund {
  id: string;
  slug: string;
  display_name: string;
  fund_type: FundType;
  description?: string;
  status: FundStatus;
  zns_name?: string;
  network: Network;
  on_chain_id?: string;
  constitution_hash?: string;
  constitution_text_uri?: string;
  constitution_amended_at?: string;
  platform_charter_version?: string;
  gleyo_community_id?: string;
  gleyo_community_url?: string;
  gleyo_linked_at?: string;
  created_by_member_id: string;
  created_at: string;
  updated_at: string;
}

export interface GovernanceConfig {
  fund_id: string;
  quorum_percent: number;
  pass_threshold_percent: number;
  voting_period_secs: number;
  execution_delay_secs: number;
  min_voters?: number;
  proposal_policy: ProposalPolicy;
  allow_abstain: boolean;
  voting_power_mode: VotingPowerMode;
}

export interface Member {
  id: string;
  fund_id: string;
  /** @deprecated use shielded_ua — kept for backward compatibility */
  orchard_ua: string;
  shielded_ua: string;
  display_name: string;
  role: MemberRole;
  status: MemberStatus;
  voting_power: number;
  invited_by?: string;
  on_chain_member_id?: string;
  member_commitment?: string;
  private_ordering_ack?: boolean;
  joined_at?: string;
}

export interface Invite {
  id: string;
  fund_id: string;
  role: MemberRole;
  token_hash: string;
  expires_at: string;
  accepted_by_member_id?: string;
  status: InviteStatus;
}

export interface TreasuryMeta {
  fund_id: string;
  receive_ua?: string;
  balance_zatoshis: number;
  balance_source: BalanceSource;
  on_chain_treasury_ref?: string;
  gleyo_allocated_zatoshis?: number;
  gleyo_deposit_ua?: string;
  last_synced_at?: string;
}

export interface ProposalTally {
  yes: number;
  no: number;
  abstain: number;
  eligible_power: number;
  turnout_percent: number;
}

export interface Proposal {
  id: string;
  fund_id: string;
  proposal_type: ProposalType;
  title: string;
  description: string;
  status: ProposalStatus;
  created_by_member_id: string;
  opens_at?: string;
  closes_at?: string;
  execution_status: ExecutionStatus;
  payload: Record<string, unknown>;
  on_chain_proposal_id?: string;
  proposal_hash?: string;
  tally?: ProposalTally;
}

export interface SpendIntentPayload {
  recipient_ua: string;
  amount_zatoshis: number;
  memo?: string;
  expires_at?: string;
  txid?: string;
  execution_member_id?: string;
  payment_proof?: string;
  contract_execution_hash?: string;
}

export interface VoteAttestation {
  scheme: string;
  message: string;
  signature: string;
  address: string;
}

export interface Vote {
  id: string;
  proposal_id: string;
  member_id: string;
  choice: VoteChoice;
  weight: number;
  attestation?: VoteAttestation;
  zk_proof?: string;
  on_chain_vote_id?: string;
  voted_at: string;
}

export interface DepositRecord {
  id: string;
  fund_id: string;
  txid: string;
  amount_zatoshis: number;
  block_height?: number;
  memo?: string;
  recorded_at: string;
}

export interface FundEvent {
  id: string;
  fund_id: string;
  event_type: string;
  actor_member_id?: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CrosslinkPolicy {
  fund_id: string;
  enabled: boolean;
  max_stake_percent?: number;
  delegate_to?: string;
  notes?: string;
}

export interface GleyoBudgetAllocation {
  fund_id: string;
  proposal_id: string;
  amount_zatoshis: number;
  txid?: string;
  gleyo_community_id: string;
  status: "pending" | "confirmed" | "failed";
}

export const DEFAULT_GOVERNANCE: Omit<GovernanceConfig, "fund_id"> = {
  quorum_percent: 40,
  pass_threshold_percent: 67,
  voting_period_secs: 604800,
  execution_delay_secs: 0,
  proposal_policy: "any_member",
  allow_abstain: true,
  voting_power_mode: "one_member_one_vote",
};

/** Compute whether a proposal passes given tally and config. */
export function proposalPasses(
  tally: ProposalTally,
  config: Pick<GovernanceConfig, "quorum_percent" | "pass_threshold_percent">,
): boolean {
  const denom = tally.yes + tally.no;
  if (denom === 0) return false;
  const passRatio = (tally.yes / denom) * 100;
  return (
    tally.turnout_percent >= config.quorum_percent &&
    passRatio >= config.pass_threshold_percent
  );
}

/** Compute tally from votes and eligible power. */
export function computeTally(
  votes: Pick<Vote, "choice" | "weight">[],
  eligiblePower: number,
): ProposalTally {
  let yes = 0;
  let no = 0;
  let abstain = 0;
  for (const v of votes) {
    if (v.choice === "yes") yes += v.weight;
    else if (v.choice === "no") no += v.weight;
    else abstain += v.weight;
  }
  const participating = yes + no + abstain;
  const turnout_percent =
    eligiblePower > 0 ? (participating / eligiblePower) * 100 : 0;
  return { yes, no, abstain, eligible_power: eligiblePower, turnout_percent };
}
