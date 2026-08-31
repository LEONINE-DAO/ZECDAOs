import type {
  CastVoteInput,
  CreateFundInput,
  CreateProposalInput,
  Fund,
  GovernanceConfig,
  Member,
  PaymentProof,
  Proposal,
  TreasuryMeta,
  Vote,
  ZkVoteProof,
} from "./backend.js";

export * from "./types.js";
export * from "./backend.js";

/** Portable backend interface — UI does not depend on coordinator vs contract. */
export interface OrgBackend {
  createFund(input: CreateFundInput): Promise<Fund>;
  getFund(slug: string): Promise<Fund | null>;
  getFundById(id: string): Promise<Fund | null>;
  listMembers(fundId: string): Promise<Member[]>;
  getGovernanceConfig(fundId: string): Promise<GovernanceConfig>;
  createProposal(
    fundId: string,
    input: CreateProposalInput,
    memberId: string,
  ): Promise<Proposal>;
  activateProposal(proposalId: string, memberId: string): Promise<Proposal>;
  castVote(proposalId: string, vote: CastVoteInput): Promise<Vote>;
  finalizeProposal(proposalId: string): Promise<Proposal>;
  getTreasury(fundId: string): Promise<TreasuryMeta>;
  listProposals(fundId: string): Promise<Proposal[]>;
  getProposal(proposalId: string): Promise<Proposal | null>;
  listVotes(proposalId: string): Promise<Vote[]>;
}

export interface HybridBackend extends OrgBackend {
  submitVoteProof(proposalId: string, proof: ZkVoteProof): Promise<Vote>;
  executeSpendIntent(
    proposalId: string,
    paymentProof?: PaymentProof,
  ): Promise<Proposal>;
  getExecutionGate(
    proposalId: string,
  ): Promise<{ may_execute: boolean; execution_delay_until?: string }>;
  registerFundOnChain(fundId: string): Promise<Fund>;
  syncProposalFromChain(proposalId: string): Promise<Proposal>;
}

export interface GleyoIntegration {
  linkCommunity(fundId: string, gleyoCommunityId: string): Promise<Fund>;
  getCommunityBalance(
    gleyoCommunityId: string,
  ): Promise<{ balance_zatoshis: number }>;
  ingestGleyoWebhook(event: GleyoWebhookEvent): Promise<void>;
}

export interface GleyoWebhookEvent {
  type: string;
  gleyo_community_id: string;
  payload: Record<string, unknown>;
}
