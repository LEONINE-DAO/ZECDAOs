"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Proposal, Vote } from "@zcashorg/schema";
import { CoordinatorBackend } from "@zcashorg/sdk";
import { createBackend } from "@/lib/backend";
import {
  COORDINATOR_URL,
  loadSession,
  signVoteMessage,
} from "@/lib/nozy";

export default function ProposalPage() {
  const params = useParams();
  const slug = String(params.slug);
  const id = String(params.id);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<{ may_execute: boolean } | null>(null);

  useEffect(() => {
    fetch(`${COORDINATOR_URL}/v1/proposals/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProposal(d.proposal);
        setVotes(d.votes);
      })
      .catch(() => setError("load failed"));
  }, [id]);

  useEffect(() => {
    if (proposal?.status === "passed") {
      createBackend()
        .getExecutionGate(id)
        .then(setGate)
        .catch(() => {});
    }
  }, [proposal, id]);

  async function castVote(choice: "yes" | "no" | "abstain") {
    const session = loadSession();
    if (!session) {
      setError("Connect and create/join fund from this browser");
      return;
    }
    const message = `zcashorg-vote-v1:${id}:${choice}:${session.memberId}`;
    let attestation;
    try {
      const signature = await signVoteMessage(message, session.shieldedUa);
      attestation = {
        scheme: "nozy-sm-v1",
        message,
        signature,
        address: session.shieldedUa,
      };
    } catch {
      attestation = undefined;
    }
    const client = new CoordinatorBackend({
      baseUrl: COORDINATOR_URL,
      fundId: session.fundId,
      apiKey: session.apiKey,
      fundSlug: session.fundSlug,
    });
    await client.castVote(id, {
      member_id: session.memberId,
      choice,
      attestation,
    });
    const res = await fetch(`${COORDINATOR_URL}/v1/proposals/${id}`);
    const d = await res.json();
    setProposal(d.proposal);
    setVotes(d.votes);
  }

  async function finalize() {
    const session = loadSession();
    if (!session) return;
    const client = new CoordinatorBackend({
      baseUrl: COORDINATOR_URL,
      fundId: session.fundId,
      apiKey: session.apiKey,
      fundSlug: session.fundSlug,
    });
    const p = await client.finalizeProposal(id);
    setProposal(p);
  }

  async function executeSpend() {
    const session = loadSession();
    if (!session) return;
    const backend = createBackend();
    try {
      const p = await backend.executeSpendIntent(id);
      setProposal(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "execute failed");
    }
  }

  if (!proposal) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>{proposal.title}</h1>
      <p className="muted">
        <span className={`badge ${proposal.status}`}>{proposal.status}</span> ·{" "}
        {proposal.proposal_type}
      </p>
      <div className="card">
        <p>{proposal.description}</p>
        {proposal.tally && (
          <p>
            Tally: yes {proposal.tally.yes}, no {proposal.tally.no}, abstain{" "}
            {proposal.tally.abstain} · turnout{" "}
            {proposal.tally.turnout_percent.toFixed(1)}%
          </p>
        )}
      </div>

      {proposal.status === "active" && (
        <div className="card">
          <h2>Vote</h2>
          <p style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={() => castVote("yes")}>
              Yes
            </button>
            <button type="button" className="secondary" onClick={() => castVote("no")}>
              No
            </button>
            <button type="button" className="secondary" onClick={() => castVote("abstain")}>
              Abstain
            </button>
          </p>
          {loadSession()?.fundSlug === slug && (
            <button type="button" onClick={finalize}>
              Finalize (after close)
            </button>
          )}
        </div>
      )}

      {proposal.status === "passed" &&
        proposal.proposal_type === "spend_intent" &&
        gate?.may_execute && (
          <div className="card">
            <h2>Execute (Ironwood via Nozy)</h2>
            <button type="button" onClick={executeSpend}>
              Execute spend
            </button>
          </div>
        )}

      <div className="card">
        <h3>Votes ({votes.length})</h3>
        <ul>
          {votes.map((v) => (
            <li key={v.id}>
              {v.choice} · weight {v.weight}
              {v.attestation && " · signed"}
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="error">{error}</p>}
      <p>
        <a href={`/f/${slug}`}>← Back to fund</a>
      </p>
    </div>
  );
}
