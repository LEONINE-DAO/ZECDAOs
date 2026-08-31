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

## Phase 0a — Planning

- [x] Bootstrap repo with planning docs
- [x] Define portable data model
- [x] OD-001 lock (Hybrid C + zk-CosmWasm, Proof VM devnet provisional)
- [x] Gleyo ecosystem integration doc
- [x] Constitution + token strategy docs
- [x] `packages/schema` JSON Schema + TypeScript

## Phase 0–1 — Coordinator MVP (shipped)

- [x] Postgres migrations
- [x] REST `/v1`
- [x] Nozy extension connect (web)
- [x] Proposal/vote UI (coordinator tally interim)
- [x] docker-compose self-host

---

## Phase 1b — zk-CosmWasm (initial)

- [x] Contract scaffold (`contracts/zcashorg`)
- [x] Indexer stub
- [ ] Deploy to Proof VM devnet
- [ ] Wire HybridBackend on-chain sync

---

## Phase 2 — Web dapp (initial)

- [x] Next.js `apps/web`
- [x] `HybridBackend` adapter
- [ ] Public fund page polish

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
