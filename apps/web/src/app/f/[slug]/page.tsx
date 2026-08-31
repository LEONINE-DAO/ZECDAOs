"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CoordinatorBackend } from "@zcashorg/sdk";
import type { Fund, Member, Proposal, TreasuryMeta } from "@zcashorg/schema";
import { COORDINATOR_URL, loadSession } from "@/lib/nozy";

export default function FundPage() {
  const params = useParams();
  const slug = String(params.slug);
  const [data, setData] = useState<{
    fund: Fund;
    members: Member[];
    treasury: TreasuryMeta;
    proposals: Proposal[];
  } | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = typeof window !== "undefined" ? loadSession() : null;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${COORDINATOR_URL}/v1/funds/${slug}`);
        if (!res.ok) throw new Error("fund not found");
        const fundData = await res.json();
        const propRes = await fetch(
          `${COORDINATOR_URL}/v1/funds/${slug}/proposals`,
        );
        const propData = await propRes.json();
        setData({
          fund: fundData.fund,
          members: fundData.members,
          treasury: fundData.treasury,
          proposals: propData.proposals,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "load failed");
      }
    }
    load();
  }, [slug]);

  async function createInvite() {
    const s = loadSession();
    if (!s || s.fundSlug !== slug) {
      setError("Save fund session first (create fund from this browser)");
      return;
    }
    const client = new CoordinatorBackend({
      baseUrl: COORDINATOR_URL,
      fundId: s.fundId,
      apiKey: s.apiKey,
      fundSlug: s.fundSlug,
    });
    client.setFundContext(data!.fund);
    const { token } = await client.createInvite(s.fundId, "member");
    setInviteToken(`${window.location.origin}/invite/${token}`);
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  const { fund, members, treasury, proposals } = data;

  return (
    <div>
      <h1>{fund.display_name}</h1>
      <p className="muted">
        <span className="badge">{fund.fund_type}</span> · {fund.slug} ·{" "}
        {fund.network}
      </p>

      <div className="card">
        <h2>Treasury</h2>
        <p>
          Receive: <code>{treasury.receive_ua ?? "—"}</code>
        </p>
        <p>
          Balance: {(treasury.balance_zatoshis / 1e8).toFixed(8)} ZEC (
          {treasury.balance_source})
        </p>
        <p className="muted">Ironwood-only sends via NozyWallet (Phase 3 execute).</p>
      </div>

      <div className="card">
        <h2>Members ({members.length})</h2>
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              {m.display_name} — {m.role}{" "}
              <span className="muted">{m.shielded_ua.slice(0, 10)}…</span>
            </li>
          ))}
        </ul>
        {session?.fundSlug === slug && (
          <button type="button" onClick={createInvite}>
            Create invite link
          </button>
        )}
        {inviteToken && (
          <p className="muted">
            Invite URL: <a href={inviteToken}>{inviteToken}</a>
          </p>
        )}
      </div>

      <div className="card">
        <h2>Proposals</h2>
        <Link href={`/f/${slug}/proposals/new`} className="btn">
          New proposal
        </Link>
        <ul style={{ marginTop: "1rem" }}>
          {proposals.map((p) => (
            <li key={p.id} style={{ marginBottom: "0.5rem" }}>
              <Link href={`/f/${slug}/proposals/${p.id}`}>
                {p.title}
              </Link>{" "}
              <span className={`badge ${p.status}`}>{p.status}</span>
            </li>
          ))}
          {proposals.length === 0 && (
            <li className="muted">No proposals yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
