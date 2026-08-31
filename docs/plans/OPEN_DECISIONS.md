# Open decisions

Living document. Resolve items here before locking implementation.

## OD-001 recommendation — Hybrid C + zk-CosmWasm

**Status:** **Locked (provisional)** — zk-CosmWasm Proof VM devnet for Phase 1b; mainnet companion chain + audit before production.

**Problem:** Zcash L1 has no general smart-contract VM. Zcashorg needs members, proposals, votes, and enforceable `spend_intent` without putting treasury balances on a transparent ledger.

**Recommended lock:**

| Decision | Resolution |
|----------|------------|
| **OD-001** Contract target | **zk-CosmWasm** on a companion CosmWasm chain (Proof VM) — not Zcash L1 |
| **OD-002** On-chain vs off-chain | **On-chain:** membership rules, proposal lifecycle, tally, execution gate. **Off-chain:** descriptions, avatars, email invites, activity feeds |
| **OD-003** Custody | **Hybrid:** ZEC stays in **Ironwood** pool notes at shielded UAs; contract authorizes spends; Nozy executes via Ironwood send / PCZT |
| **OD-004** Coordinator | **Retained** for UX/metadata — not sole source of truth for governance pass/fail |

**Why zk-CosmWasm (not coordinator-only):**

- Governance pass/fail is authoritative on-chain — harder to forge than trusting API alone
- ZK proofs support private ballots and eligibility without publishing full UAs on explorers
- `spend_intent` becomes an execution gate: contract `pending` → Nozy pays → proof → `executed`
- Shielded ZEC never moves to the CosmWasm chain — money stays on Zcash L1 via Nozy

**Still to confirm:** companion chain identity, ZK circuit scope (eligibility vs private ballot), contract audit timeline, Nozy zk-cosmwasm proof POST upstream fixtures.

References: [NozyWallet `tools/zk-cosmwasm-upstream`](https://github.com/LEONINE-DAO/Nozy-wallet/tree/master/tools/zk-cosmwasm-upstream), [`tools/vote-sdk`](https://github.com/LEONINE-DAO/Nozy-wallet/tree/master/tools/vote-sdk).

---

## Entity → layer mapping

| Entity / concern | Coordinator (Postgres) | zk-CosmWasm contract | NozyWallet |
|------------------|------------------------|----------------------|------------|
| **Fund** | slug, display_name, description, zns_name, Gleyo link | fund registry hash, governance config, `on_chain_id`, `constitution_hash` | treasury UA (Ironwood) |
| **Member** | display_name, invite flow | member commitment (hash), role, voting_power, status | `shielded_ua` via connect |
| **Invite** | token, expiry, delivery | — (accept writes commitment on-chain) | accept with connected UA |
| **GovernanceConfig** | UI cache | authoritative quorum, threshold, voting_period | — |
| **Proposal** | title, description, rich payload | id, type hash, status, tally, execution gate | — |
| **Vote** | — | tally input (ZK proof or signed eligibility) | `zcash_signMessage` or ZK submit |
| **SpendIntent** | recipient, memo in coordinator | approved spend hash, amount cap, `execution_status` | shielded send / PCZT |
| **TreasuryMeta** | balance cache | execution gate only (no ZEC on CosmWasm) | sync, send, witness |
| **FundEvent** | activity feed | indexer events mirrored | txid on execute |
| **Gleyo** | `gleyo_community_id`, allocation txids | optional pass marker for budget allocate | ZEC to Gleyo deposit |

---

## Blockers (need confirmation)

### OD-001a: Companion chain

**Provisional lock:** NozyWallet `tools/zk-cosmwasm-upstream` Proof VM **devnet** for Phase 1b development and integration tests. Production deployment network (dedicated app chain vs public CosmWasm hub) remains open until audit scoping.

**Audit timeline:** Target external audit before mainnet governance contracts; not blocking Phase 0–1 coordinator MVP.

### OD-001b: ZK vote scope

- **Eligibility-only:** prove membership; vote choice may be public on-chain
- **Private ballot:** full vote-sdk-style shielded voting (higher complexity)

### OD-005: Nozy proof glue

Timeline for end-to-end zk proof POST from Nozy → CosmWasm verify (upstream fixtures).

---

## Decided

### OD-100: Target repo

**Decision:** [LEONINE-DAO/Zcashorg](https://github.com/LEONINE-DAO/Zcashorg) — **Date:** 2026-08-30

### OD-101: NozyWallet relationship

**Decision:** Standalone dapp; extension provider connect (not embedded in wallet core). — **Date:** 2026-08-30

### OD-102: Phase 0 scope

**Decision:** Data models + planning docs first; custody execution phased. — **Date:** 2026-08-30

### OD-103: Fund types

**Decision:** `family`, `business`, `investment_club`, `community`. — **Date:** 2026-08-30

### OD-104: Governance defaults

**Decision:** quorum 40%, pass threshold 67%, 7-day voting, one-member-one-vote in Phase 0. — **Date:** 2026-08-30

### OD-105: Gleyo integration

**Decision:** Ecosystem integration — Zcashorg governs treasury; [Gleyo](https://github.com/gilmorre/gleyo-Zechub-) handles quests and contributor payouts. See [GLEYO_INTEGRATION.md](./GLEYO_INTEGRATION.md). — **Date:** 2026-08-31

### OD-106: Execution pattern

**Decision:** Hybrid C — zk-CosmWasm governance + coordinator UX + Nozy shielded ZEC. — **Date:** 2026-08-31

### OD-107: Ironwood-only money rail

**Decision:** All ZEC sends and treasury operations use **Ironwood pool** notes at unified addresses (`u1…`). Orchard legacy notes require ZIP 318 migration before spend. — **Date:** 2026-08-31

### OD-008: Platform token

**Decision:** Ship Phase 0–3 **without** a platform token. ZEC + `Member.voting_power` only. Future shielded token via **ZSA on Zcash** after mainnet + Ironwood + Nozy support. **No Zcash fork.** See [TOKEN_STRATEGY.md](./TOKEN_STRATEGY.md). — **Date:** 2026-08-31

---

## How to resolve a decision

1. Add outcome under **Decided** with date and rationale.
2. Update [ARCHITECTURE.md](./ARCHITECTURE.md) and [ROADMAP.md](./ROADMAP.md).
3. Close or reference a GitHub issue.
