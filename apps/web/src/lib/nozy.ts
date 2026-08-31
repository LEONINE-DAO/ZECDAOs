export interface NozyProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

declare global {
  interface Window {
    nozy?: NozyProvider;
    ethereum?: NozyProvider;
  }
}

export const COORDINATOR_URL =
  process.env.NEXT_PUBLIC_COORDINATOR_URL ?? "http://localhost:8787";

export async function getNozyProvider(): Promise<NozyProvider | null> {
  if (typeof window === "undefined") return null;
  if (window.nozy) return window.nozy;
  if (window.ethereum) return window.ethereum;
  return null;
}

export async function connectNozy(): Promise<string> {
  const provider = await getNozyProvider();
  if (!provider) {
    throw new Error("NozyWallet extension not found");
  }
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts[0]) throw new Error("No account returned");
  return accounts[0];
}

export async function signVoteMessage(
  message: string,
  address: string,
): Promise<string> {
  const provider = await getNozyProvider();
  if (!provider) throw new Error("NozyWallet not connected");
  const sig = await provider.request({
    method: "personal_sign",
    params: [message, address],
  });
  return String(sig);
}

export async function sendShieldedTx(params: {
  to: string;
  amountZatoshis: number;
  memo?: string;
}): Promise<string> {
  const provider = await getNozyProvider();
  if (!provider) throw new Error("NozyWallet not connected");
  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        to: params.to,
        value: `0x${params.amountZatoshis.toString(16)}`,
        data: params.memo ? Buffer.from(params.memo).toString("hex") : undefined,
      },
    ],
  });
  return String(txHash);
}

export function loadSession(): {
  fundId: string;
  fundSlug: string;
  apiKey: string;
  memberId: string;
  shieldedUa: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("zcashorg_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: {
  fundId: string;
  fundSlug: string;
  apiKey: string;
  memberId: string;
  shieldedUa: string;
}): void {
  localStorage.setItem("zcashorg_session", JSON.stringify(session));
}
