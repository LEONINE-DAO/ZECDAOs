# Open decisions

Living document. Resolve items here before locking architecture and starting implementation.

## Blockers (need input)

### OD-001: Smart contract target

**Status:** Blocked — awaiting spec from team

**Question:** What is the smart contract execution environment?

- ZSA / Orchard program on Zcash?
- Companion chain (CosmWasm, custom L1)?
- Hybrid with off-chain coordinator?

**Needed:** VM, language, deployment network, audit timeline.

---

### OD-002: On-chain vs off-chain state

**Status:** Blocked — depends on OD-001

**Question:** What must be enforced on-chain vs stored in a coordinator / indexer?

| Concern | On-chain candidate | Off-chain candidate |
|---------|-------------------|---------------------|
| Membership roster | ? | ? |
| Voting / tally | ? | ? |
| Treasury custody | ? | ? |
| Proposal metadata | ? | ? |
| Spend execution | ? | ? |

---

### OD-003: Custody model

**Status:** Blocked — depends on OD-001

**Options:**

1. **Deferred (Phase 0)** — proposals describe spend intent only; no automatic execution
2. **PCZT co-sign** — reuse NozyWallet multisig workflow (off-chain policy)
3. **Contract-held treasury** — funds locked in on-chain vault
4. **Hybrid** — contract rules + wallet co-sign for Orchard spends

**Prior choice:** defer custody execution in Phase 0 (confirmed).

---

### OD-004: Coordination layer

**Status:** Leaning self-hosted coordinator — may change with contract

**Prior choice:** self-hosted API per org (or future hosted SaaS).

**Reopen if:** contract-primary path makes coordinator optional (indexer only).

---

## Decided

### OD-100: Target repo

**Decision:** [LEONINE-DAO/Zcashorg](https://github.com/LEONINE-DAO/Zcashorg)

**Date:** 2026-08-30

---

### OD-101: NozyWallet relationship

**Decision:** Standalone dapp repo; first-class NozyWallet dapp via browser extension provider (not embedded in wallet core).

**Date:** 2026-08-30

---

### OD-102: Phase 0 scope

**Decision:** Data models + planning docs first. Custody execution deferred. Smart contract approach not set in stone.

**Date:** 2026-08-30

---

### OD-103: Fund types (product)

**Decision:** Support `family`, `business`, `investment_club`, `community` fund types in domain model.

**Date:** 2026-08-30

---

### OD-104: Governance defaults

**Decision:** Default quorum 40%, pass threshold 67% yes/(yes+no), 7-day voting period, one-member-one-vote in Phase 0.

**Date:** 2026-08-30

---

## How to resolve a decision

1. Add outcome under **Decided** with date and rationale.
2. Update [ARCHITECTURE.md](./ARCHITECTURE.md) and [ROADMAP.md](./ROADMAP.md).
3. Close or reference a GitHub issue if one exists.
