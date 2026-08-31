# Roadmap

**Status:** Draft — phases may shift when smart contract spec lands. See [OPEN_DECISIONS.md](./OPEN_DECISIONS.md).

## Phase summary

| Phase | Name | Deliverable | Blocked by |
|-------|------|-------------|------------|
| **0a** | Planning | `docs/plans/*`, domain model | — |
| **0b** | Architecture lock | `ARCHITECTURE.md` finalized, `packages/schema` | Smart contract spec (OD-001) |
| **1** | Backend | Coordinator and/or contract client + adapter | Architecture decision |
| **2** | Web dapp | UI: create fund, invite, propose, vote + Nozy connect | Backend adapter |
| **3** | Treasury | Balance sync (indexer / UFVK opt-in) + spend execution | Custody model (OD-003) |
| **4** | Crosslink | Vault staking proposals | Crosslink mainnet |

---

## Phase 0a — Planning (current)

**Goal:** Shared understanding of what we build.

- [x] Bootstrap repo with planning docs
- [x] Define portable data model
- [x] Document open decisions
- [ ] Receive smart contract spec from team
- [ ] Lock architecture (Phase 0b)

**Out of scope:** code, contracts, production custody.

---

## Phase 0b — Architecture lock

**Goal:** Choose execution layer and repo structure.

- [ ] Resolve OD-001 through OD-003 in [OPEN_DECISIONS.md](./OPEN_DECISIONS.md)
- [ ] Finalize [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ ] Add `packages/schema` JSON Schema from [DATA_MODEL.md](./DATA_MODEL.md)
- [ ] Open GitHub issues for Phase 1 workstreams

---

## Phase 1 — Backend

**Goal:** Persist and query fund state.

**If coordinator path:**

- Postgres migrations
- REST `/v1` API (funds, members, invites, proposals, votes, treasury, events)
- Fund API key auth; invite token flow
- Proposal finalize + tally cron

**If contract path:**

- Contract deploy to testnet
- Indexer for on-chain events → domain model
- `ContractBackend` adapter

**If hybrid:** both, with clear source of truth per entity field.

---

## Phase 2 — Web dapp

**Goal:** DAO DAO–style UX for Zcash orgs.

- Next.js app under `apps/web`
- NozyWallet extension connect ([NOZY_INTEGRATION.md](./NOZY_INTEGRATION.md))
- Fund dashboard, member list, proposal create/vote
- Public fund profile by slug

---

## Phase 3 — Treasury and execution

**Goal:** Move from planning spends to executing them.

- Treasury balance watcher (LWD / indexer; UFVK disclosure opt-in)
- Approved `spend_intent` → execution path:
  - PCZT co-sign via NozyWallet, and/or
  - Contract vault payout
- Record `txid` on proposal payload

**Requires:** custody RFC + security review.

---

## Phase 4 — Crosslink

**Goal:** Optional idle-ZEC staking for org treasuries.

- `crosslink_policy` proposal type enabled
- Integrate with NozyWallet Crosslink APIs when mainnet ships
- Respect `max_stake_percent` and unbonding delays

---

## NozyWallet ecosystem

| Milestone | Where |
|-----------|-------|
| List Zcashorg as featured dapp | NozyWallet landing / docs (issue in Nozy-wallet repo) |
| Vote attestations | `zcash_signMessage` when account support allows |
| Spend execution | PCZT co-sign per NozyWallet MULTISIG_DESIGN |

---

## Success metrics (draft)

- Org created and first member invited end-to-end
- Proposal created, voted, finalized with correct tally
- Nozy connect works on mainnet test flow
- (Phase 3+) Approved spend broadcasts and records txid
