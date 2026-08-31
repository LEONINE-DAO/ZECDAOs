import { randomBytes } from "node:crypto";
import pg from "pg";
import { ulid } from "ulid";
import {
  DEFAULT_GOVERNANCE,
  computeTally,
  proposalPasses,
  type Fund,
  type FundEvent,
  type GovernanceConfig,
  type Invite,
  type Member,
  type Proposal,
  type TreasuryMeta,
  type Vote,
} from "@zcashorg/schema";
import { generateApiKey, hashApiKey } from "./migrate.js";

export class CoordinatorStore {
  constructor(private pool: pg.Pool) {}

  async createFund(input: {
    slug: string;
    display_name: string;
    fund_type: Fund["fund_type"];
    description?: string;
    network: Fund["network"];
    zns_name?: string;
    owner_display_name: string;
    shielded_ua: string;
    receive_ua?: string;
    constitution_hash?: string;
    constitution_text_uri?: string;
    private_ordering_ack?: boolean;
  }): Promise<{ fund: Fund; member: Member; api_key: string }> {
    const fundId = ulid();
    const memberId = ulid();
    const now = new Date().toISOString();
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO funds (
          id, slug, display_name, fund_type, description, status, zns_name, network,
          api_key_hash, constitution_hash, constitution_text_uri, created_by_member_id,
          created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,$9,$10,$11,$12,$12)`,
        [
          fundId,
          input.slug,
          input.display_name,
          input.fund_type,
          input.description ?? null,
          input.zns_name ?? null,
          input.network,
          apiKeyHash,
          input.constitution_hash ?? null,
          input.constitution_text_uri ?? null,
          memberId,
          now,
        ],
      );

      const gov = DEFAULT_GOVERNANCE;
      await client.query(
        `INSERT INTO governance_configs (
          fund_id, quorum_percent, pass_threshold_percent, voting_period_secs,
          execution_delay_secs, proposal_policy, allow_abstain, voting_power_mode
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          fundId,
          gov.quorum_percent,
          gov.pass_threshold_percent,
          gov.voting_period_secs,
          gov.execution_delay_secs,
          gov.proposal_policy,
          gov.allow_abstain,
          gov.voting_power_mode,
        ],
      );

      await client.query(
        `INSERT INTO members (
          id, fund_id, shielded_ua, display_name, role, status, voting_power,
          private_ordering_ack, joined_at
        ) VALUES ($1,$2,$3,$4,'owner','active',1,$5,$6)`,
        [
          memberId,
          fundId,
          input.shielded_ua,
          input.owner_display_name,
          input.private_ordering_ack ?? true,
          now,
        ],
      );

      await client.query(
        `INSERT INTO treasury_meta (fund_id, receive_ua, balance_zatoshis, balance_source)
         VALUES ($1,$2,0,$3)`,
        [fundId, input.receive_ua ?? input.shielded_ua, "unconfigured"],
      );

      await client.query(
        `INSERT INTO crosslink_policies (fund_id, enabled) VALUES ($1, FALSE)`,
        [fundId],
      );

      await this.insertEvent(client, {
        fund_id: fundId,
        event_type: "fund.created",
        actor_member_id: memberId,
        entity_type: "fund",
        entity_id: fundId,
        payload: { slug: input.slug },
      });

      await client.query("COMMIT");

      const fund = await this.getFundById(fundId);
      const member = await this.getMemberById(memberId);
      if (!fund || !member) throw new Error("fund create failed");
      return { fund, member, api_key: apiKey };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async verifyFundApiKey(fundId: string, apiKey: string): Promise<boolean> {
    const hash = hashApiKey(apiKey);
    const res = await this.pool.query(
      "SELECT 1 FROM funds WHERE id = $1 AND api_key_hash = $2",
      [fundId, hash],
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async getFundBySlug(slug: string): Promise<Fund | null> {
    const res = await this.pool.query("SELECT * FROM funds WHERE slug = $1", [
      slug,
    ]);
    return res.rows[0] ? this.rowToFund(res.rows[0]) : null;
  }

  async getFundById(id: string): Promise<Fund | null> {
    const res = await this.pool.query("SELECT * FROM funds WHERE id = $1", [id]);
    return res.rows[0] ? this.rowToFund(res.rows[0]) : null;
  }

  async listMembers(fundId: string): Promise<Member[]> {
    const res = await this.pool.query(
      "SELECT * FROM members WHERE fund_id = $1 AND status != 'removed' ORDER BY joined_at",
      [fundId],
    );
    return res.rows.map((r) => this.rowToMember(r));
  }

  async getMemberById(id: string): Promise<Member | null> {
    const res = await this.pool.query("SELECT * FROM members WHERE id = $1", [
      id,
    ]);
    return res.rows[0] ? this.rowToMember(res.rows[0]) : null;
  }

  async getMemberByUa(
    fundId: string,
    shieldedUa: string,
  ): Promise<Member | null> {
    const res = await this.pool.query(
      "SELECT * FROM members WHERE fund_id = $1 AND shielded_ua = $2 AND status = 'active'",
      [fundId, shieldedUa],
    );
    return res.rows[0] ? this.rowToMember(res.rows[0]) : null;
  }

  async getGovernanceConfig(fundId: string): Promise<GovernanceConfig> {
    const res = await this.pool.query(
      "SELECT * FROM governance_configs WHERE fund_id = $1",
      [fundId],
    );
    if (!res.rows[0]) throw new Error("governance config not found");
    const r = res.rows[0];
    return {
      fund_id: r.fund_id,
      quorum_percent: r.quorum_percent,
      pass_threshold_percent: r.pass_threshold_percent,
      voting_period_secs: r.voting_period_secs,
      execution_delay_secs: r.execution_delay_secs,
      min_voters: r.min_voters ?? undefined,
      proposal_policy: r.proposal_policy,
      allow_abstain: r.allow_abstain,
      voting_power_mode: r.voting_power_mode,
    };
  }

  async createInvite(
    fundId: string,
    role: Member["role"],
    expiresInHours = 168,
  ): Promise<{ invite: Invite; token: string }> {
    const token = randomToken();
    const tokenHash = hashApiKey(token);
    const id = ulid();
    const expires = new Date(Date.now() + expiresInHours * 3600 * 1000);

    await this.pool.query(
      `INSERT INTO invites (id, fund_id, role, token_hash, expires_at, status)
       VALUES ($1,$2,$3,$4,$5,'open')`,
      [id, fundId, role, tokenHash, expires.toISOString()],
    );

    return {
      invite: {
        id,
        fund_id: fundId,
        role,
        token_hash: tokenHash,
        expires_at: expires.toISOString(),
        status: "open",
      },
      token,
    };
  }

  async acceptInvite(
    token: string,
    input: {
      shielded_ua: string;
      display_name: string;
      private_ordering_ack?: boolean;
    },
  ): Promise<{ member: Member; fund: Fund }> {
    const tokenHash = hashApiKey(token);
    const inviteRes = await this.pool.query(
      "SELECT * FROM invites WHERE token_hash = $1 AND status = 'open'",
      [tokenHash],
    );
    const invite = inviteRes.rows[0];
    if (!invite) throw new Error("invite not found or already used");
    if (new Date(invite.expires_at) < new Date()) {
      await this.pool.query(
        "UPDATE invites SET status = 'expired' WHERE id = $1",
        [invite.id],
      );
      throw new Error("invite expired");
    }

    const memberId = ulid();
    const now = new Date().toISOString();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO members (
          id, fund_id, shielded_ua, display_name, role, status, voting_power,
          private_ordering_ack, joined_at
        ) VALUES ($1,$2,$3,$4,$5,'active',1,$6,$7)`,
        [
          memberId,
          invite.fund_id,
          input.shielded_ua,
          input.display_name,
          invite.role,
          input.private_ordering_ack ?? true,
          now,
        ],
      );
      await client.query(
        "UPDATE invites SET status = 'accepted', accepted_by_member_id = $1 WHERE id = $2",
        [memberId, invite.id],
      );
      await this.insertEvent(client, {
        fund_id: invite.fund_id,
        event_type: "member.joined",
        actor_member_id: memberId,
        entity_type: "member",
        entity_id: memberId,
        payload: { role: invite.role },
      });
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const member = await this.getMemberById(memberId);
    const fund = await this.getFundById(invite.fund_id);
    if (!member || !fund) throw new Error("accept invite failed");
    return { member, fund };
  }

  async createProposal(
    fundId: string,
    input: {
      proposal_type: Proposal["proposal_type"];
      title: string;
      description: string;
      payload?: Record<string, unknown>;
      created_by_member_id: string;
    },
  ): Promise<Proposal> {
    const id = ulid();
    await this.pool.query(
      `INSERT INTO proposals (
        id, fund_id, proposal_type, title, description, status,
        created_by_member_id, execution_status, payload
      ) VALUES ($1,$2,$3,$4,$5,'draft',$6,'not_applicable',$7)`,
      [
        id,
        fundId,
        input.proposal_type,
        input.title,
        input.description,
        input.created_by_member_id,
        JSON.stringify(input.payload ?? {}),
      ],
    );
    await this.insertEvent(this.pool, {
      fund_id: fundId,
      event_type: "proposal.created",
      actor_member_id: input.created_by_member_id,
      entity_type: "proposal",
      entity_id: id,
      payload: { title: input.title },
    });
    const p = await this.getProposal(id);
    if (!p) throw new Error("proposal create failed");
    return p;
  }

  async activateProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error("proposal not found");
    if (proposal.status !== "draft") throw new Error("proposal not draft");

    const config = await this.getGovernanceConfig(proposal.fund_id);
    const opens = new Date();
    const closes = new Date(
      opens.getTime() + config.voting_period_secs * 1000,
    );

    await this.pool.query(
      `UPDATE proposals SET status = 'active', opens_at = $1, closes_at = $2 WHERE id = $3`,
      [opens.toISOString(), closes.toISOString(), proposalId],
    );

    const p = await this.getProposal(proposalId);
    if (!p) throw new Error("activate failed");
    return p;
  }

  async castVote(input: {
    proposal_id: string;
    member_id: string;
    choice: Vote["choice"];
    attestation?: Vote["attestation"];
  }): Promise<Vote> {
    const proposal = await this.getProposal(input.proposal_id);
    if (!proposal) throw new Error("proposal not found");
    if (proposal.status !== "active") throw new Error("proposal not active");

    const member = await this.getMemberById(input.member_id);
    if (!member || member.fund_id !== proposal.fund_id) {
      throw new Error("member not in fund");
    }

    const id = ulid();
    const weight = member.voting_power;
    const now = new Date().toISOString();

    await this.pool.query(
      `INSERT INTO votes (id, proposal_id, member_id, choice, weight, attestation, voted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (proposal_id, member_id) DO UPDATE SET
         choice = EXCLUDED.choice, weight = EXCLUDED.weight,
         attestation = EXCLUDED.attestation, voted_at = EXCLUDED.voted_at`,
      [
        id,
        input.proposal_id,
        input.member_id,
        input.choice,
        weight,
        input.attestation ? JSON.stringify(input.attestation) : null,
        now,
      ],
    );

    await this.insertEvent(this.pool, {
      fund_id: proposal.fund_id,
      event_type: "vote.cast",
      actor_member_id: input.member_id,
      entity_type: "vote",
      entity_id: id,
      payload: { proposal_id: input.proposal_id, choice: input.choice },
    });

    const votes = await this.listVotes(input.proposal_id);
    return votes.find((v) => v.member_id === input.member_id)!;
  }

  async finalizeProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error("proposal not found");
    if (proposal.status !== "active") throw new Error("proposal not active");
    if (proposal.closes_at && new Date(proposal.closes_at) > new Date()) {
      throw new Error("voting period not ended");
    }

    const config = await this.getGovernanceConfig(proposal.fund_id);
    const members = await this.listMembers(proposal.fund_id);
    const eligiblePower = members
      .filter((m) => m.role !== "viewer" && m.role !== "auditor")
      .reduce((s, m) => s + m.voting_power, 0);

    const votes = await this.listVotes(proposalId);
    const tally = computeTally(votes, eligiblePower);
    const passed = proposalPasses(tally, config);
    const status = passed ? "passed" : "rejected";
    const executionStatus =
      passed &&
      (proposal.proposal_type === "spend_intent" ||
        proposal.proposal_type === "gleyo_budget_allocate")
        ? "pending"
        : proposal.execution_status;

    await this.pool.query(
      `UPDATE proposals SET status = $1, tally = $2, execution_status = $3 WHERE id = $4`,
      [status, JSON.stringify(tally), executionStatus, proposalId],
    );

    const p = await this.getProposal(proposalId);
    if (!p) throw new Error("finalize failed");
    return p;
  }

  async getProposal(id: string): Promise<Proposal | null> {
    const res = await this.pool.query("SELECT * FROM proposals WHERE id = $1", [
      id,
    ]);
    return res.rows[0] ? this.rowToProposal(res.rows[0]) : null;
  }

  async listProposals(fundId: string): Promise<Proposal[]> {
    const res = await this.pool.query(
      "SELECT * FROM proposals WHERE fund_id = $1 ORDER BY id DESC",
      [fundId],
    );
    return res.rows.map((r) => this.rowToProposal(r));
  }

  async listVotes(proposalId: string): Promise<Vote[]> {
    const res = await this.pool.query(
      "SELECT * FROM votes WHERE proposal_id = $1",
      [proposalId],
    );
    return res.rows.map((r) => this.rowToVote(r));
  }

  async getTreasury(fundId: string): Promise<TreasuryMeta> {
    const res = await this.pool.query(
      "SELECT * FROM treasury_meta WHERE fund_id = $1",
      [fundId],
    );
    if (!res.rows[0]) throw new Error("treasury not found");
    return this.rowToTreasury(res.rows[0]);
  }

  async listEvents(fundId: string, limit = 50): Promise<FundEvent[]> {
    const res = await this.pool.query(
      "SELECT * FROM fund_events WHERE fund_id = $1 ORDER BY created_at DESC LIMIT $2",
      [fundId, limit],
    );
    return res.rows.map((r) => ({
      id: r.id,
      fund_id: r.fund_id,
      event_type: r.event_type,
      actor_member_id: r.actor_member_id ?? undefined,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      payload: r.payload ?? {},
      created_at: new Date(r.created_at).toISOString(),
    }));
  }

  async recordExecution(
    proposalId: string,
    txid: string,
    executionMemberId: string,
  ): Promise<Proposal> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) throw new Error("proposal not found");
    if (proposal.status !== "passed") throw new Error("proposal not passed");

    const payload = { ...proposal.payload, txid, execution_member_id: executionMemberId };
    await this.pool.query(
      `UPDATE proposals SET status = 'executed', execution_status = 'completed', payload = $1 WHERE id = $2`,
      [JSON.stringify(payload), proposalId],
    );
    const p = await this.getProposal(proposalId);
    if (!p) throw new Error("record execution failed");
    return p;
  }

  private async insertEvent(
    client: pg.Pool | pg.PoolClient,
    e: Omit<FundEvent, "id" | "created_at">,
  ): Promise<void> {
    await client.query(
      `INSERT INTO fund_events (id, fund_id, event_type, actor_member_id, entity_type, entity_id, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        ulid(),
        e.fund_id,
        e.event_type,
        e.actor_member_id ?? null,
        e.entity_type,
        e.entity_id,
        JSON.stringify(e.payload),
      ],
    );
  }

  private rowToFund(r: pg.QueryResultRow): Fund {
    return {
      id: r.id,
      slug: r.slug,
      display_name: r.display_name,
      fund_type: r.fund_type,
      description: r.description ?? undefined,
      status: r.status,
      zns_name: r.zns_name ?? undefined,
      network: r.network,
      on_chain_id: r.on_chain_id ?? undefined,
      constitution_hash: r.constitution_hash ?? undefined,
      constitution_text_uri: r.constitution_text_uri ?? undefined,
      constitution_amended_at: r.constitution_amended_at
        ? new Date(r.constitution_amended_at).toISOString()
        : undefined,
      platform_charter_version: r.platform_charter_version ?? undefined,
      gleyo_community_id: r.gleyo_community_id ?? undefined,
      gleyo_community_url: r.gleyo_community_url ?? undefined,
      gleyo_linked_at: r.gleyo_linked_at
        ? new Date(r.gleyo_linked_at).toISOString()
        : undefined,
      created_by_member_id: r.created_by_member_id,
      created_at: new Date(r.created_at).toISOString(),
      updated_at: new Date(r.updated_at).toISOString(),
    };
  }

  private rowToMember(r: pg.QueryResultRow): Member {
    return {
      id: r.id,
      fund_id: r.fund_id,
      orchard_ua: r.shielded_ua,
      shielded_ua: r.shielded_ua,
      display_name: r.display_name,
      role: r.role,
      status: r.status,
      voting_power: r.voting_power,
      invited_by: r.invited_by ?? undefined,
      on_chain_member_id: r.on_chain_member_id ?? undefined,
      member_commitment: r.member_commitment ?? undefined,
      private_ordering_ack: r.private_ordering_ack,
      joined_at: r.joined_at
        ? new Date(r.joined_at).toISOString()
        : undefined,
    };
  }

  private rowToProposal(r: pg.QueryResultRow): Proposal {
    return {
      id: r.id,
      fund_id: r.fund_id,
      proposal_type: r.proposal_type,
      title: r.title,
      description: r.description,
      status: r.status,
      created_by_member_id: r.created_by_member_id,
      opens_at: r.opens_at ? new Date(r.opens_at).toISOString() : undefined,
      closes_at: r.closes_at ? new Date(r.closes_at).toISOString() : undefined,
      execution_status: r.execution_status,
      payload: r.payload ?? {},
      on_chain_proposal_id: r.on_chain_proposal_id ?? undefined,
      proposal_hash: r.proposal_hash ?? undefined,
      tally: r.tally ?? undefined,
    };
  }

  private rowToVote(r: pg.QueryResultRow): Vote {
    return {
      id: r.id,
      proposal_id: r.proposal_id,
      member_id: r.member_id,
      choice: r.choice,
      weight: r.weight,
      attestation: r.attestation ?? undefined,
      zk_proof: r.zk_proof ?? undefined,
      on_chain_vote_id: r.on_chain_vote_id ?? undefined,
      voted_at: new Date(r.voted_at).toISOString(),
    };
  }

  private rowToTreasury(r: pg.QueryResultRow): TreasuryMeta {
    return {
      fund_id: r.fund_id,
      receive_ua: r.receive_ua ?? undefined,
      balance_zatoshis: Number(r.balance_zatoshis),
      balance_source: r.balance_source,
      on_chain_treasury_ref: r.on_chain_treasury_ref ?? undefined,
      gleyo_allocated_zatoshis: r.gleyo_allocated_zatoshis
        ? Number(r.gleyo_allocated_zatoshis)
        : undefined,
      gleyo_deposit_ua: r.gleyo_deposit_ua ?? undefined,
      last_synced_at: r.last_synced_at
        ? new Date(r.last_synced_at).toISOString()
        : undefined,
    };
  }
}

function randomToken(): string {
  return `inv_${randomBytes(24).toString("hex")}`;
}
