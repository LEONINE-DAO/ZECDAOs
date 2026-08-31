# Zcashorg planning docs

This folder is the **source of truth for architecture and domain design**. Implementation lives in `packages/`, `contracts/`, `services/`, and `apps/`.

## Documents

| File | Purpose | Status |
|------|---------|--------|
| [DATA_MODEL.md](./DATA_MODEL.md) | Portable domain entities | Implemented in `packages/schema` |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Hybrid C: zk-CosmWasm + coordinator + Nozy | **Locked** |
| [OPEN_DECISIONS.md](./OPEN_DECISIONS.md) | OD-001, OD-008, entity mapping | Living doc |
| [CONSTITUTION.md](./CONSTITUTION.md) | Platform charter (private ordering) | Draft v0.1.0 |
| [FUND_CONSTITUTION_TEMPLATE.md](./FUND_CONSTITUTION_TEMPLATE.md) | Per-fund constitution overlay | Template |
| [TOKEN_STRATEGY.md](./TOKEN_STRATEGY.md) | No platform token at launch; ZSA deferred | **Decided** |
| [GLEYO_INTEGRATION.md](./GLEYO_INTEGRATION.md) | Gleyo quest/payout ecosystem link | Decided (OD-105) |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery | Updated |
| [NOZY_INTEGRATION.md](./NOZY_INTEGRATION.md) | Ironwood + extension provider | Draft |

## Changelog

| Date | Change |
|------|--------|
| 2026-08-31 | Full MVP: schema, coordinator, web, contracts scaffold, constitution, OD-008 |
| 2026-08-31 | OD-001 Hybrid C + zk-CosmWasm; Gleyo integration; entity mapping |
