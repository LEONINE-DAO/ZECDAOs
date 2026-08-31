# Zcashorg

Zcash-native org/DAO dapp — shielded ZEC funds with governance on **Hybrid C** (zk-CosmWasm + coordinator + NozyWallet).

## Quick start

```bash
# Install dependencies
npm install

# Start Postgres + coordinator + indexer
docker compose up -d postgres
npm run migrate -w @zcashorg/coordinator
npm run dev:coordinator

# Web dapp (separate terminal)
npm run dev:web
```

- Coordinator: http://localhost:8787
- Web UI: http://localhost:3001
- Indexer stub: http://localhost:8788

Or one command:

```bash
docker compose up --build
```

## Monorepo layout

```
packages/schema/     JSON Schema + TypeScript domain types
packages/sdk/          CoordinatorBackend + HybridBackend
services/coordinator/  Postgres REST /v1 API
services/indexer/      CosmWasm event stub
contracts/zcashorg/    zk-CosmWasm governance (Phase 1b)
apps/web/              Next.js dapp
docs/plans/            Architecture, data model, constitution
```

## Planning docs

- [Architecture](./docs/plans/ARCHITECTURE.md) — Hybrid C locked
- [Data model](./docs/plans/DATA_MODEL.md)
- [Open decisions](./docs/plans/OPEN_DECISIONS.md) — OD-001, OD-008
- [Constitution](./docs/plans/CONSTITUTION.md)
- [Token strategy](./docs/plans/TOKEN_STRATEGY.md) — no platform token at launch
- [Nozy integration](./docs/NOZY_INTEGRATION.md)

## API (coordinator `/v1`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/v1/funds` | — |
| GET | `/v1/funds/:slug` | — |
| POST | `/v1/funds/:fundId/invites` | Fund API key |
| POST | `/v1/invites/:token/accept` | — |
| POST | `/v1/funds/:fundId/proposals` | Fund API key |
| POST | `/v1/proposals/:id/votes` | — |
| POST | `/v1/proposals/:id/finalize` | Fund API key |
| POST | `/v1/proposals/:id/execute` | Fund API key |

Fund API key is returned once on fund create — store in browser session for admin actions.

## License

See repository license. AI-assisted implementation — human authors responsible for correctness.
