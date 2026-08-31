import type {
  CastVoteInput,
  CreateFundInput,
  CreateProposalInput,
  Fund,
  GovernanceConfig,
  HybridBackend,
  Member,
  OrgBackend,
  PaymentProof,
  Proposal,
  TreasuryMeta,
  Vote,
  ZkVoteProof,
} from "@zcashorg/schema";

export interface CoordinatorClientConfig {
  baseUrl: string;
  fundId?: string;
  fundSlug?: string;
  apiKey?: string;
}

export class CoordinatorBackend implements OrgBackend {
  constructor(private config: CoordinatorClientConfig) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.fundId && this.config.apiKey) {
      h["x-fund-id"] = this.config.fundId;
      h["x-fund-api-key"] = this.config.apiKey;
    }
    return h;
  }

  private async fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers(), ...init?.headers },
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async createFund(input: CreateFundInput): Promise<Fund> {
    const res = await this.fetchJson<{
      fund: Fund;
      member: Member;
      api_key: string;
    }>("/v1/funds", {
      method: "POST",
      body: JSON.stringify(input),
    });
    this.config.fundId = res.fund.id;
    this.config.apiKey = res.api_key;
    this.setFundContext(res.fund);
    return res.fund;
  }

  getLastApiKey(): string | undefined {
    return this.config.apiKey;
  }

  async getFund(slug: string): Promise<Fund | null> {
    const res = await this.fetchJson<{ fund: Fund }>(`/v1/funds/${slug}`);
    return res.fund;
  }

  async getFundById(id: string): Promise<Fund | null> {
    throw new Error("getFundById: use slug lookup in coordinator mode");
  }

  async listMembers(fundId: string): Promise<Member[]> {
    const fund = await this.resolveFund(fundId);
    const res = await this.fetchJson<{ members: Member[] }>(
      `/v1/funds/${fund.slug}`,
    );
    return res.members;
  }

  async getGovernanceConfig(fundId: string): Promise<GovernanceConfig> {
    const fund = await this.resolveFund(fundId);
    const res = await this.fetchJson<{ governance: GovernanceConfig }>(
      `/v1/funds/${fund.slug}`,
    );
    return res.governance;
  }

  async createProposal(
    fundId: string,
    input: CreateProposalInput,
    memberId: string,
  ): Promise<Proposal> {
    const res = await this.fetchJson<{ proposal: Proposal }>(
      `/v1/funds/${fundId}/proposals`,
      {
        method: "POST",
        body: JSON.stringify({ ...input, member_id: memberId }),
      },
    );
    return res.proposal;
  }

  async activateProposal(proposalId: string, _memberId: string): Promise<Proposal> {
    const res = await this.fetchJson<{ proposal: Proposal }>(
      `/v1/proposals/${proposalId}/activate`,
      { method: "POST", body: "{}" },
    );
    return res.proposal;
  }

  async castVote(proposalId: string, vote: CastVoteInput): Promise<Vote> {
    const res = await this.fetchJson<{ vote: Vote }>(
      `/v1/proposals/${proposalId}/votes`,
      {
        method: "POST",
        body: JSON.stringify(vote),
      },
    );
    return res.vote;
  }

  async finalizeProposal(proposalId: string): Promise<Proposal> {
    const res = await this.fetchJson<{ proposal: Proposal }>(
      `/v1/proposals/${proposalId}/finalize`,
      { method: "POST", body: "{}" },
    );
    return res.proposal;
  }

  async getTreasury(fundId: string): Promise<TreasuryMeta> {
    const fund = await this.resolveFund(fundId);
    const res = await this.fetchJson<{ treasury: TreasuryMeta }>(
      `/v1/funds/${fund.slug}`,
    );
    return res.treasury;
  }

  async listProposals(fundId: string): Promise<Proposal[]> {
    const fund = await this.resolveFund(fundId);
    const res = await this.fetchJson<{ proposals: Proposal[] }>(
      `/v1/funds/${fund.slug}/proposals`,
    );
    return res.proposals;
  }

  async getProposal(proposalId: string): Promise<Proposal | null> {
    const res = await this.fetchJson<{ proposal: Proposal }>(
      `/v1/proposals/${proposalId}`,
    );
    return res.proposal;
  }

  async listVotes(proposalId: string): Promise<Vote[]> {
    const res = await this.fetchJson<{ votes: Vote[] }>(
      `/v1/proposals/${proposalId}`,
    );
    return res.votes;
  }

  async createInvite(
    fundId: string,
    role: Member["role"],
    expiresInHours?: number,
  ): Promise<{ token: string; inviteUrl: string }> {
    const res = await this.fetchJson<{ token: string }>(
      `/v1/funds/${fundId}/invites`,
      {
        method: "POST",
        body: JSON.stringify({ role, expires_in_hours: expiresInHours }),
      },
    );
    return { token: res.token, inviteUrl: `/invite/${res.token}` };
  }

  async acceptInvite(
    token: string,
    input: { shielded_ua: string; display_name: string },
  ): Promise<{ member: Member; fund: Fund }> {
    return this.fetchJson(`/v1/invites/${token}/accept`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  setFundContext(fund: Fund): void {
    this.fundCache.set(fund.id, fund);
    this.config.fundId = fund.id;
    this.config.fundSlug = fund.slug;
  }

  private fundCache = new Map<string, Fund>();

  private async resolveFund(fundId: string): Promise<Fund> {
    const cached = this.fundCache.get(fundId);
    if (cached) return cached;
    if (this.config.fundId === fundId && this.config.fundSlug) {
      const fund = await this.getFund(this.config.fundSlug);
      if (fund) {
        this.setFundContext(fund);
        return fund;
      }
    }
    throw new Error("Fund context not set — call setFundContext or createFund first");
  }
}

export interface ContractClientConfig {
  rpcUrl: string;
  contractAddress: string;
}

/** Minimal contract client — Phase 1b stub; syncs from indexer when available. */
export class ContractClient {
  constructor(private config: ContractClientConfig) {}

  async queryMayExecute(proposalOnChainId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.rpcUrl}/may_execute/${proposalOnChainId}`);
      if (!res.ok) return false;
      const data = (await res.json()) as { may_execute: boolean };
      return data.may_execute;
    } catch {
      return false;
    }
  }

  async registerFund(_fundId: string): Promise<string> {
    return `chain_fund_${Date.now()}`;
  }
}

export interface NozyExecutionHook {
  sendShieldedTx(params: {
    to: string;
    amountZatoshis: number;
    memo?: string;
  }): Promise<{ txid: string }>;
}

export class HybridBackendImpl implements HybridBackend {
  constructor(
    private coordinator: CoordinatorBackend,
    private contract: ContractClient,
    private nozy?: NozyExecutionHook,
  ) {}

  createFund(input: CreateFundInput): Promise<Fund> {
    return this.coordinator.createFund(input);
  }

  getFund(slug: string): Promise<Fund | null> {
    return this.coordinator.getFund(slug);
  }

  getFundById(id: string): Promise<Fund | null> {
    return this.coordinator.getFundById(id);
  }

  listMembers(fundId: string): Promise<Member[]> {
    return this.coordinator.listMembers(fundId);
  }

  getGovernanceConfig(fundId: string): Promise<GovernanceConfig> {
    return this.coordinator.getGovernanceConfig(fundId);
  }

  createProposal(
    fundId: string,
    input: CreateProposalInput,
    memberId: string,
  ): Promise<Proposal> {
    return this.coordinator.createProposal(fundId, input, memberId);
  }

  activateProposal(proposalId: string, memberId: string): Promise<Proposal> {
    return this.coordinator.activateProposal(proposalId, memberId);
  }

  castVote(proposalId: string, vote: CastVoteInput): Promise<Vote> {
    return this.coordinator.castVote(proposalId, vote);
  }

  finalizeProposal(proposalId: string): Promise<Proposal> {
    return this.coordinator.finalizeProposal(proposalId);
  }

  getTreasury(fundId: string): Promise<TreasuryMeta> {
    return this.coordinator.getTreasury(fundId);
  }

  listProposals(fundId: string): Promise<Proposal[]> {
    return this.coordinator.listProposals(fundId);
  }

  getProposal(proposalId: string): Promise<Proposal | null> {
    return this.coordinator.getProposal(proposalId);
  }

  listVotes(proposalId: string): Promise<Vote[]> {
    return this.coordinator.listVotes(proposalId);
  }

  async submitVoteProof(
    proposalId: string,
    proof: ZkVoteProof,
  ): Promise<Vote> {
    return this.coordinator.castVote(proposalId, {
      member_id: proof.member_id,
      choice: proof.choice ?? "yes",
      attestation: {
        scheme: "zk-vote-v1",
        message: proof.proof,
        signature: proof.proof,
        address: proof.member_id,
      },
    });
  }

  async getExecutionGate(
    proposalId: string,
  ): Promise<{ may_execute: boolean; execution_delay_until?: string }> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error("proposal not found");
    if (proposal.status !== "passed") {
      return { may_execute: false };
    }
    const config = await this.getGovernanceConfig(proposal.fund_id);
    const closesAt = proposal.closes_at
      ? new Date(proposal.closes_at).getTime()
      : 0;
    const delayUntil = closesAt + config.execution_delay_secs * 1000;
    const now = Date.now();
    if (now < delayUntil) {
      return {
        may_execute: false,
        execution_delay_until: new Date(delayUntil).toISOString(),
      };
    }
    if (proposal.on_chain_proposal_id) {
      const chainOk = await this.contract.queryMayExecute(
        proposal.on_chain_proposal_id,
      );
      if (!chainOk) return { may_execute: false };
    }
    return { may_execute: true };
  }

  async executeSpendIntent(
    proposalId: string,
    paymentProof?: PaymentProof,
  ): Promise<Proposal> {
    const gate = await this.getExecutionGate(proposalId);
    if (!gate.may_execute) throw new Error("execution gate closed");

    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error("proposal not found");

    if (paymentProof?.txid) {
      const res = await fetch(
        `${(this.coordinator as unknown as { config: CoordinatorClientConfig }).config.baseUrl}/v1/proposals/${proposalId}/execute`,
        {
          method: "POST",
          headers: (this.coordinator as CoordinatorBackend)["headers"](),
          body: JSON.stringify({
            txid: paymentProof.txid,
            execution_member_id: paymentProof.execution_member_id,
          }),
        },
      );
      if (!res.ok) throw new Error("record execution failed");
      const data = (await res.json()) as { proposal: Proposal };
      return data.proposal;
    }

    if (!this.nozy) throw new Error("Nozy execution hook not configured");
    const payload = proposal.payload as {
      recipient_ua?: string;
      amount_zatoshis?: number;
      memo?: string;
    };
    if (!payload.recipient_ua || !payload.amount_zatoshis) {
      throw new Error("invalid spend_intent payload");
    }
    const { txid } = await this.nozy.sendShieldedTx({
      to: payload.recipient_ua,
      amountZatoshis: payload.amount_zatoshis,
      memo: payload.memo,
    });
    return this.executeSpendIntent(proposalId, {
      txid,
      execution_member_id: paymentProof?.execution_member_id,
      proposal_hash: proposal.proposal_hash,
    });
  }

  async registerFundOnChain(fundId: string): Promise<Fund> {
    const onChainId = await this.contract.registerFund(fundId);
    void onChainId;
    const fund = await this.getFundById(fundId);
    if (!fund) throw new Error("fund not found");
    return fund;
  }

  syncProposalFromChain(proposalId: string): Promise<Proposal> {
    return this.getProposal(proposalId).then((p) => {
      if (!p) throw new Error("proposal not found");
      return p;
    });
  }
}
