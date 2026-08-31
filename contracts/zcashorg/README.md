# zk-CosmWasm governance contracts (Phase 1b)

Minimal CosmWasm contract for Zcashorg governance:

- Fund registry with `constitution_hash` and governance params
- Member commitments (hash-only on-chain)
- Proposal lifecycle: create → vote → finalize
- Execution gate query: `MayExecute`

ZEC stays on Zcash L1 (Ironwood via Nozy) — this contract holds **authorization only**.

## Build

Requires Rust and `wasm32-unknown-unknown` target:

```bash
rustup target add wasm32-unknown-unknown
cd contracts/zcashorg
cargo build --release --target wasm32-unknown-unknown
```

Deploy to NozyWallet `tools/zk-cosmwasm-upstream` Proof VM devnet (OD-001 provisional lock).

## Messages

See `src/contract.rs` for `InstantiateMsg`, `ExecuteMsg`, and `QueryMsg`.

## Indexer

Contract events are mirrored by `services/indexer` into the coordinator domain model.
