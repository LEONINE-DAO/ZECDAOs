# Gleyo integration

**Status:** Decided — ecosystem integration (OD-105). Zcashorg governs treasury; Gleyo operates quests and payouts.

**Gleyo repo:** [gilmorre/gleyo-Zechub-](https://github.com/gilmorre/gleyo-Zechub-) · **Live:** [gleyo.app](https://gleyo.app)

## Division of responsibility

| Layer | Zcashorg | Gleyo |
|-------|----------|-------|
| Who can spend | Members vote; quorum + threshold | Admins approve quest submissions |
| What gets funded | Proposals allocate budget | Quests lock ZEC from community wallet |
| Money movement | Fund treasury → Gleyo deposit | Community wallet → reward hub → shielded withdrawal |
| Identity | `orchard_ua` via Nozy | Email + optional wallet verify |
| Audit | Proposals, votes, allocation txids | Quests, withdrawals, retention |

## Flow

1. Create Fund in Zcashorg; link Gleyo Community (`gleyo_community_id`).
2. Proposal `gleyo_budget_allocate` — vote on ZEC amount for a program period.
3. On pass (+ optional on-chain gate in Hybrid C): send ZEC to Gleyo shielded deposit UA.
4. Gleyo verifies deposit via Nozy balance delta (existing mainnet flow).
5. Gleyo admins create quests; contributors earn and withdraw to `u1…`.

## Proposal types

| Type | Purpose |
|------|---------|
| `gleyo_link` | Attach or change linked Gleyo community |
| `gleyo_budget_allocate` | Move ZEC from Fund treasury to Gleyo community wallet |
| `gleyo_program_approve` | Optional cap on quest budget without another vote |

**`gleyo_budget_allocate` payload:**

```json
{
  "gleyo_community_id": "uuid-or-slug",
  "amount_zatoshis": 500000000,
  "memo": "Zcashorg Fund smith-family Q1 growth",
  "program_label": "Q1 contributor rewards"
}
```

## Data model fields (Fund)

- `gleyo_community_id`, `gleyo_community_url`, `gleyo_linked_at`
- `TreasuryMeta.gleyo_allocated_zatoshis`, `gleyo_deposit_ua`

## Phasing

| Phase | Zcashorg | Gleyo |
|-------|----------|-------|
| 0 | Fields + docs | No changes |
| 1 | Manual allocate + txid | Existing deposit flow |
| 2 | Nozy execute after on-chain pass | Optional webhook/API |
| 3 | Unified auditor dashboard | Reporting API |

## Gleyo coordination needs (future)

- Optional deposit memo with Fund slug
- Read API or webhooks for quest spend / withdrawal totals
- Server-to-server auth if Zcashorg coordinator calls Gleyo
