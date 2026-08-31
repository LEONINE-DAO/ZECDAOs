# Roadmap

**Status:** Hybrid C + zk-CosmWasm recommended. See [OPEN_DECISIONS.md](./OPEN_DECISIONS.md).

## Phase summary

| Phase | Name | Deliverable |
|-------|------|-------------|
| **0a** | Planning | `docs/plans/*`, domain model, OD-001 recommendation |
| **0–1** | Coordinator MVP | Postgres `/v1`, invites, UI metadata, Nozy connect |
| **1b** | zk-CosmWasm | Member commitments, proposal + vote finalize on companion chain |
| **2** | Web dapp | `HybridBackend`, fund dashboard, propose/vote |
| **3** | Treasury execution | `spend_intent` + Nozy send + payment proof → `executed` |
| **3b** | Gleyo | `gleyo_budget_allocate` after on-chain pass |
| **4** | Crosslink | Vault staking proposals |

---

## Phase 0a — Planning (current)

- [x] Bootstrap repo with planning docs
- [x] Define portable data model
- [x] OD-001 recommendation (Hybrid C + zk-CosmWasm)
- [x] Gleyo ecosystem integration doc
- [ ] Confirm OD-001 companion chain + ZK scope
- [ ] Add `packages/schema` JSON Schema

---

## Phase 0–1 — Coordinator MVP

Ship fast while contracts are in development. Coordinator is **not** sole source of truth for governance once Phase 1b lands.

- Postgres migrations
- REST `/v1` (metadata, invites, feeds, treasury cache)
- Nozy extension connect
- Proposal/vote UI (coordinator tally until contract indexer)

---

## Phase 1b — zk-CosmWasm

- Deploy contracts to testnet (companion chain TBD)
- Fund registry, member commitments, proposal lifecycle, vote tally
- Indexer → domain model
- ZK eligibility proofs (vote-sdk patterns) or signed attestations

---

## Phase 2 — Web dapp

- Next.js `apps/web`
- `HybridBackend` adapter
- Public fund page (outcomes without full payment graph)

---

## Phase 3 — Treasury execution

- Treasury balance watcher (LWD / UFVK opt-in)
- Contract execution gate → Nozy PCZT/send
- Payment proof → proposal `executed` + `txid`

---

## Phase 3b — Gleyo

- On-chain pass for `gleyo_budget_allocate`
- ZEC transfer to Gleyo deposit; audit in FundEvent

---

## Phase 4 — Crosslink

- `crosslink_policy` proposals when Crosslink mainnet ships

---

## Success metrics

- Fund created + member invited end-to-end
- Proposal voted; pass/fail matches contract (Phase 1b+)
- Approved spend executes in Orchard with recorded txid (Phase 3)
- Gleyo budget allocation after governance pass (Phase 3b)
