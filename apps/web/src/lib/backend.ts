import { CoordinatorBackend, HybridBackendImpl, ContractClient } from "@zcashorg/sdk";
import { COORDINATOR_URL, connectNozy, loadSession, sendShieldedTx } from "./nozy";

export function createBackend() {
  const session = loadSession();
  const coordinator = new CoordinatorBackend({
    baseUrl: COORDINATOR_URL,
    fundId: session?.fundId,
    apiKey: session?.apiKey,
  });
  const contract = new ContractClient({
    rpcUrl: process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:8788",
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
  });
  return new HybridBackendImpl(coordinator, contract, {
    sendShieldedTx: async (p) => {
      const txid = await sendShieldedTx(p);
      return { txid };
    },
  });
}

export { connectNozy, loadSession, COORDINATOR_URL };
