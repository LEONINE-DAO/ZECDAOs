# Per-Fund Constitution Template

Each Fund adopts the [Platform Charter](./CONSTITUTION.md) plus the sections below. Canonical text is hashed as `Fund.constitution_hash` on the CosmWasm registry.

## 1. Fund identity

| Field | Value |
|-------|-------|
| **Display name** | _e.g. Smith Family Treasury_ |
| **Fund type** | `family` \| `business` \| `investment_club` \| `community` |
| **Purpose** | _One paragraph describing why this fund exists_ |
| **Slug** | _URL handle_ |

## 2. Membership

| Field | Value |
|-------|-------|
| **Who may join** | _Invite-only / open application / board approval_ |
| **Roles** | owner, admin, member, auditor, viewer |
| **Exit policy** | _Notice period, voluntary withdrawal rules_ |
| **Private ordering ack** | Members must accept platform charter + this document at join |

## 3. Governance parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Quorum | _40%_ | Of active participating voting power |
| Pass threshold | _67%_ | `yes / (yes + no)` |
| Voting period | _7 days_ | |
| Execution timelock | _see preset_ | After pass, before `may_execute` |
| Proposal policy | `any_member` \| `admins_only` \| `owners_only` | |
| Vote privacy | private ballot \| ZK eligibility \| public | |

### Presets by fund type

| Section | Family | Business | Community |
|---------|--------|----------|-----------|
| Purpose | Household shared expenses | Operating treasury | Grants / ambassadors |
| Members | Parents + dependents | Board + staff | Open join + delegates |
| Quorum / threshold | 40% / 67% | 50% / 67% | 40% / 67% |
| Timelock | 0–24h | 3 days | 7 days |
| Modules | Treasury only | Constitutional + Treasury | Constitutional + Treasury |
| Vote privacy | Private ballot default | ZK eligibility | Configurable |
| Spend caps | Per-proposal max | Monthly budget cap | Grant size limits |
| Emergency council | 2-of-3 parents | 2-of-3 board | Optional 9-of-12 |
| Gleyo link | Optional chores | Ambassador budget | Primary disbursement |

## 4. Treasury rules

| Rule | Value |
|------|-------|
| Receive address | Fund `u1…` (Ironwood) |
| Allowed spends | Passed `spend_intent` and approved Gleyo budget proposals only |
| Per-proposal max (zatoshis) | _optional cap_ |
| Monthly budget cap (zatoshis) | _optional cap_ |
| Legacy Orchard | Must complete ZIP 318 before execute |

## 5. Constitutional vs treasury proposals

| Class | Examples | Module |
|-------|----------|--------|
| Constitutional | `member_add`, `member_remove`, `policy_change`, `constitution_amend` | Constitutional |
| Treasury | `spend_intent`, `gleyo_budget_allocate`, `gleyo_program_approve` | Treasury |

Treasury module **cannot** change membership or contract logic.

## 6. Gleyo integration (optional)

| Field | Value |
|-------|-------|
| Linked community ID | _nullable_ |
| Budget approval | Via `gleyo_budget_allocate` proposal |
| Quest program cap | Via `gleyo_program_approve` (optional) |

## 7. Dispute resolution

| Dispute type | Process |
|--------------|---------|
| On-chain pass/fail | Contract tally is final |
| Off-platform conduct | _Family mediation / board arbitration / forum + optional Kleros_ |
| Emergency | _Emergency council m-of-n pause_ |

## 8. Amendments

Amendments to this document require a **constitutional proposal** with:

- Published diff in coordinator UI
- Member review period: _default 7 days_
- Pass per governance parameters above
- On-chain update to `constitution_hash`

## 9. On-chain binding

```
constitution_hash = keccak256(canonical_markdown_utf8)
```

Stored on Fund registry at create; updated only via passed `constitution_amend` proposal.

## 10. Signatures / acknowledgments

Members acknowledge at join:

- [ ] Platform Charter v0.1.0
- [ ] This per-fund constitution (hash: _TBD at publish_)
