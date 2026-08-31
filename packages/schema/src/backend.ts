import type {
  FundType,
  MemberRole,
  Network,
  ProposalType,
  VoteChoice,
} from "./types.js";

export interface CreateFundInput {
  slug: string;
  display_name: string;
  fund_type: FundType;
  description?: string;
  network: Network;
  zns_name?: string;
  owner_display_name: string;
  shielded_ua: string;
  receive_ua?: string;
  constitution_hash?: string;
  constitution_text_uri?: string;
}

export interface CreateProposalInput {
  proposal_type: ProposalType;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
}

export interface CastVoteInput {
  member_id: string;
  choice: VoteChoice;
  attestation?: {
    scheme: string;
    message: string;
    signature: string;
    address: string;
  };
}

export interface ZkVoteProof {
  member_id: string;
  choice?: VoteChoice;
  proof: string;
  public_inputs?: Record<string, string>;
}

export interface PaymentProof {
  txid?: string;
  proposal_hash?: string;
  execution_member_id?: string;
  contract_execution_hash?: string;
}

export type {
  Fund,
  FundEvent,
  GovernanceConfig,
  Invite,
  Member,
  Proposal,
  TreasuryMeta,
  Vote,
} from "./types.js";
