# Zcashorg planning docs

This folder is the **source of truth for what we intend to build** before implementation lands in `packages/`, `contracts/`, and `apps/`.

## Documents

| File | Purpose | Status |
|------|---------|--------|
| [DATA_MODEL.md](./DATA_MODEL.md) | Portable domain entities (Fund, Member, Proposal, Vote, Treasury) | Draft — stable enough to implement schema |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Coordinator vs smart contract vs hybrid | **Blocked** — awaiting contract spec |
| [OPEN_DECISIONS.md](./OPEN_DECISIONS.md) | Decisions not yet locked | Living doc |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery | Draft |
| [NOZY_INTEGRATION.md](./NOZY_INTEGRATION.md) | How the web dapp talks to NozyWallet | Draft |

## How to use these docs

1. **Before coding:** read `OPEN_DECISIONS.md` for blockers.
2. **Schema work:** implement from `DATA_MODEL.md`; add `on_chain_*` fields only when `ARCHITECTURE.md` is locked.
3. **When contract spec arrives:** update `ARCHITECTURE.md` and `OPEN_DECISIONS.md`, then unblock implementation issues.

## Changelog

| Date | Change |
|------|--------|
| 2026-08-30 | Initial planning docs bootstrapped |
