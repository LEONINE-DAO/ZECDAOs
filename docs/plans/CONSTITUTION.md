# Zcashorg Protocol Charter

**Version:** 0.1.0-draft  
**Status:** Platform charter — binds all funds using Zcashorg

## Article 0 — Preamble

Zcashorg enables **private ordering** for shielded ZEC groups: family, business, investment clubs, and community treasuries.

- **Lex cryptographica:** authoritative rules live in open contracts and published constitution hashes; the coordinator is UX only under Hybrid C.
- **Privacy by default:** membership and votes may use zero-knowledge proofs; treasury moves in the **Ironwood** pool only.
- **Not legal advice:** protocol rules do not replace applicable law for real-world obligations.

## Article 1 — Definitions

| Term | Meaning |
|------|---------|
| **Fund** | A shielded ZEC org with members, governance config, and optional treasury |
| **Member** | A participant bound by `shielded_ua` and on-chain commitment |
| **Proposal** | A governance item (constitutional or treasury class) |
| **Vote** | A member ballot or ZK attestation counted toward tally |
| **SpendIntent** | A treasury proposal payload fixing recipient, amount, and memo |
| **Treasury** | Ironwood-pool ZEC at the fund's shielded unified address |
| **Execution gate** | CosmWasm state `may_execute` after pass + timelock |
| **Coordinator** | Off-chain metadata service — not vote authority |
| **Ironwood pool** | Post-NU6.3 spendable shielded ZEC pool at `u1…` addresses |

## Article 2 — Code as law

| Traditional | Zcashorg private ordering |
|-------------|---------------------------|
| Written contract | `SpendIntent` + on-chain proposal hash |
| Breach → court | Pass/fail on contract; execution gated |
| Bank enforces | Nozy executes Ironwood send after `may_execute` |
| Ambiguous terms | Deterministic quorum, threshold, timelock params |

**Rule:** No treasury spend without a **passed Treasury proposal** + timelock + Execute (Phase 3+).

## Article 3 — Governance bodies

| Body | Role |
|------|------|
| **Fund members** | Vote; propose per policy |
| **Constitutional module** | Membership, policy, constitution hash |
| **Treasury module** | `spend_intent`, Gleyo budget |
| **Optional emergency council** | Pause / cancel (m-of-n) |
| **Coordinator operator** | Metadata, invites — **not** vote authority |

**Consensus:** a proposal passes iff quorum is met and `yes / (yes + no) ≥ threshold` on **CosmWasm** (authoritative under Hybrid C).

## Article 4 — Proposal lifecycle

1. Draft (coordinator)
2. Discussion
3. On-chain vote
4. Timelock (`execution_delay_secs`)
5. Execute (Nozy Ironwood send)
6. Record `txid`

Constitutional proposals use longer timelock and higher quorum where configured. Treasury proposals bind spend caps in `SpendIntent` at vote time.

## Article 5 — Privacy & ordering

- Members may prove eligibility without publishing full UA on a public explorer (ZK).
- Votes may use private ballot where the fund constitution allows.
- Public fund pages show **outcomes**, not full payment graphs.
- Coordinators must not sell or expose member graphs without consent.

## Article 6 — Money rules (Ironwood)

- All spends use the **Ironwood pool** at shielded unified addresses.
- Legacy Orchard notes require ZIP 318 migration before spend; execution is blocked until migrated.
- ZEC is never custodied on the CosmWasm chain — **authorization only**.

## Article 7 — Dispute resolution

| Dispute | Resolver |
|---------|----------|
| Did vote pass? | On-chain tally (authoritative) |
| Was spend authorized? | Contract execution gate + `proposal_hash` |
| Coordinator vs contract mismatch | Contract wins |
| Off-platform misconduct | Per-fund constitution; optional arbitration clause |
| Smart contract bug | No on-chain undo — emergency council pause; optional fund fork |

**Limit:** immutability means exploited bugs are valid under code — members accept this risk.

## Article 8 — Exit & fork

- **Member exit:** resign membership; voting power ends.
- **Fund fork:** subset creates new Fund + new `constitution_hash`; treasury split via agreed proposal.
- **Platform exit:** stop using Zcashorg; keys remain in NozyWallet.

## Article 9 — Tokenomics

- No tradable governance token is required at launch; **voting_power** per member suffices.
- Optional future: ZSA shielded fund shares after mainnet — see [TOKEN_STRATEGY.md](./TOKEN_STRATEGY.md).
- Crosslink network staking is not fund governance weight unless explicitly configured (discouraged).

## Article 10 — Amendments

- Platform charter: maintainer process; eventual platform DAO vote.
- Per-fund rules: **constitutional proposal** updates `constitution_hash`.

## Article 11 — Limitations

1. **Immutable code** — bugs may be unrecoverable on-chain.
2. **Real-world assets** — deeds, employment, physical goods need off-chain law.
3. **Coordinator compromise** — cannot forge passed votes under Hybrid C; can censor UX (mitigation: self-host).
4. **Third parties (Gleyo)** — operational layer separate from fund governance.
5. **Not a bank, not a lawyer** — users responsible for tax, compliance, local law.

## Appendix — Private ordering comparison

| Feature | Traditional org | Zcashorg |
|---------|-----------------|----------|
| Enforcement | Contracts, courts, banks | CosmWasm gate + Ironwood send |
| Dispute resolver | Courts, HR | On-chain tally; optional off-chain arb |
| Rules created by | Board, bylaws | Members + constitution hash + contracts |
| Spend execution | Wire approval | `may_execute` → Nozy |
| Transparency | Public filings | Selective — outcomes public, graph private |
| Ultimate recourse | Lawsuit, exit company | Exit fund, fork fund, stop using protocol |
