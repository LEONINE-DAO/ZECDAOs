# Platform token strategy (OD-008)

**Status:** **Decided** — no platform token at launch; ZSA path deferred.

## Locked strategy

1. **Ship governance on ZEC + CosmWasm without a platform token** (Phase 0–3).
2. **Watch ZSA mainnet timeline and Ironwood compatibility** — do not design `ZORG` or per-fund ZSA until both are clear.
3. **Prototype issue/transfer on ZSA testnet** when ready (parallel R&D; not an MVP blocker).
4. **Plan NozyWallet support for ZSA treasuries** when protocol lands on mainnet (track in Nozy-wallet repo).

**Explicitly out of scope:** Zcash chain fork (Ycash-style).

## Approaches compared

| Approach | Fit for Zcashorg |
|----------|------------------|
| Ycash-style fork | **Poor** — splits liquidity and engineering |
| ZEC only (now) | **Ship now** — Ironwood treasury + `voting_power` |
| ZSA on Zcash (future) | **Chosen direction** — shielded platform/fund asset |
| CW20 on companion chain | Optional later; not primary token choice |

## Phased roadmap

| Phase | Token work | Governance work |
|-------|------------|-----------------|
| **0–3 (now)** | None — ZEC Ironwood treasuries only | CosmWasm + coordinator + constitution + Nozy execute |
| **Watch** | Monitor NU / ZSA ZIPs, Ironwood+ZSA, Nozy upstream | — |
| **R&D** | ZSA testnet: issue, transfer, burn prototype | — |
| **Post-ZSA mainnet** | Optional ZSA fund shares / platform asset | Map ZSA units to membership or cap table if needed |

## Future ZSA data model (not implemented yet)

| Field | Entity | Purpose |
|-------|--------|---------|
| `zsa_asset_id` | Fund | Issued fund-share asset |
| `zsa_issuer_txid` | Fund | Issuance transaction |
| `member_zsa_balance` | Member | Shielded units (wallet-synced) |
| `treasury_zsa_assets` | TreasuryMeta | Multi-asset treasury |

## Blockers (future ZSA phase only)

- ZSA activated on Zcash mainnet (post-NU7 scope)
- ZSA works with **Ironwood** pool
- NozyWallet can issue/transfer/burn ZSA in Ironwood context
- Legal/product review: securities, issuance policy, per-fund vs global token

## References

- [ZSA testnet forum thread](https://forum.zcashcommunity.com/t/zsa-testnet/56884)
- [NU7 coinholder vote scope](https://forum.zcashcommunity.com/t/nu7-coinholder-vote/56912)
- [OPEN_DECISIONS.md](./OPEN_DECISIONS.md) — OD-008
