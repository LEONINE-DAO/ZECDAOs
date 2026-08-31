"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoordinatorBackend } from "@zcashorg/sdk";
import { connectNozy, COORDINATOR_URL, saveSession } from "@/lib/nozy";

export default function CreateFundPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectedUa, setConnectedUa] = useState<string | null>(null);

  async function handleConnect() {
    try {
      const ua = await connectNozy();
      setConnectedUa(ua);
    } catch (e) {
      setError(e instanceof Error ? e.message : "connect failed");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const shieldedUa = connectedUa ?? String(form.get("shielded_ua") || "");
    if (!shieldedUa.startsWith("u1")) {
      setError("Connect NozyWallet or enter a unified address (u1…)");
      setLoading(false);
      return;
    }
    try {
      const client = new CoordinatorBackend({ baseUrl: COORDINATOR_URL });
      const res = await fetch(`${COORDINATOR_URL}/v1/funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.get("slug"),
          display_name: form.get("display_name"),
          fund_type: form.get("fund_type"),
          network: form.get("network"),
          description: form.get("description") || undefined,
          owner_display_name: form.get("owner_display_name"),
          shielded_ua: shieldedUa,
          private_ordering_ack: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "create failed");
      }
      const data = await res.json();
      client.setFundContext(data.fund);
      saveSession({
        fundId: data.fund.id,
        fundSlug: data.fund.slug,
        apiKey: data.api_key,
        memberId: data.member.id,
        shieldedUa,
      });
      router.push(`/f/${data.fund.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Create fund</h1>
      <p className="muted">
        Ironwood-only treasuries. No platform token at launch (OD-008).
      </p>
      <form onSubmit={handleSubmit} className="card">
        {!connectedUa && (
          <p>
            <button type="button" onClick={handleConnect}>
              Connect NozyWallet
            </button>
          </p>
        )}
        {connectedUa && (
          <p className="muted">Connected: {connectedUa.slice(0, 12)}…</p>
        )}
        <label>Slug</label>
        <input name="slug" required pattern="[a-z0-9-]+" placeholder="smith-family" />
        <label>Display name</label>
        <input name="display_name" required placeholder="Smith Family Treasury" />
        <label>Fund type</label>
        <select name="fund_type" required defaultValue="family">
          <option value="family">Family</option>
          <option value="business">Business</option>
          <option value="investment_club">Investment club</option>
          <option value="community">Community</option>
        </select>
        <label>Network</label>
        <select name="network" required defaultValue="mainnet">
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
        </select>
        <label>Your display name</label>
        <input name="owner_display_name" required placeholder="Alex" />
        <label>Description</label>
        <textarea name="description" rows={3} />
        {!connectedUa && (
          <>
            <label>Shielded UA (u1…)</label>
            <input name="shielded_ua" placeholder="u1…" />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create fund"}
        </button>
      </form>
    </div>
  );
}
