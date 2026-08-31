"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { connectNozy, COORDINATOR_URL } from "@/lib/nozy";

export default function InviteAcceptPage() {
  const params = useParams();
  const token = String(params.token);
  const router = useRouter();
  const [connectedUa, setConnectedUa] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    try {
      setConnectedUa(await connectNozy());
    } catch (e) {
      setError(e instanceof Error ? e.message : "connect failed");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const shieldedUa = connectedUa ?? String(form.get("shielded_ua") || "");
    try {
      const res = await fetch(`${COORDINATOR_URL}/v1/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shielded_ua: shieldedUa,
          display_name: form.get("display_name"),
          private_ordering_ack: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "accept failed");
      }
      const data = await res.json();
      router.push(`/f/${data.fund.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "accept failed");
    }
  }

  return (
    <div>
      <h1>Accept invite</h1>
      <p className="muted">
        Accept the platform charter and fund constitution (private ordering ack).
      </p>
      <form onSubmit={handleSubmit} className="card">
        {!connectedUa && (
          <button type="button" onClick={handleConnect}>
            Connect NozyWallet
          </button>
        )}
        {connectedUa && <p className="muted">Connected: {connectedUa.slice(0, 12)}…</p>}
        <label>Display name</label>
        <input name="display_name" required />
        {!connectedUa && (
          <>
            <label>Shielded UA</label>
            <input name="shielded_ua" placeholder="u1…" required />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit">Join fund</button>
      </form>
    </div>
  );
}
