# NozyWallet integration

**Status:** Phase 0–3 — extension connect, vote attestations, Ironwood execute.

Zcashorg is a **standalone dapp** using NozyWallet as the wallet surface. See also [docs/plans/NOZY_INTEGRATION.md](./docs/plans/NOZY_INTEGRATION.md).

## Ironwood-only money rail

All ZEC sends and treasury operations use **Ironwood pool** notes at unified addresses (`u1…`). Orchard legacy notes require **ZIP 318** migration before spend.

## Integration surface

| Surface | Public web dapp? |
|---------|------------------|
| Browser extension (`window.nozy`) | **Yes — primary** |
| Localhost companion REST | **No** |

## Connect

```javascript
const provider = window.nozy ?? window.ethereum;
const accounts = await provider.request({ method: "eth_requestAccounts" });
// bind accounts[0] → Member.shielded_ua
```

## Vote attestation (Phase 1)

```javascript
const message = `zcashorg-vote-v1:${proposalId}:${choice}:${memberId}`;
const signature = await provider.request({
  method: "personal_sign",
  params: [message, shieldedUa],
});
```

## Execute spend (Phase 3)

After proposal `passed` and `may_execute`:

```javascript
await provider.request({
  method: "eth_sendTransaction",
  params: [{ to: recipientUa, value: amountHex, ... }],
});
```

Pre-flight: fund synced with Ironwood scan; no unmigrated Orchard notes.

## Security

1. Never call `http://127.0.0.1:3000` companion API from public websites.
2. Shielded-only — reject transparent `t1` for treasury/payouts.
3. Do not log seeds, PCZT bytes, or API keys.

## References

- [NozyWallet extension provider](https://github.com/LEONINE-DAO/Nozy-wallet/tree/master/browser-extension/content)
- [Ironwood explainer](https://github.com/LEONINE-DAO/Nozy-wallet/blob/master/docs/reference/IRONWOOD_USER_EXPLAINER.md)
