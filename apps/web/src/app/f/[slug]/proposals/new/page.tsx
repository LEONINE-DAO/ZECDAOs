"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CoordinatorBackend } from "@zcashorg/sdk";
import { COORDINATOR_URL, loadSession } from "@/lib/nozy";

export default function NewProposalPage() {
  const params = useParams();
  const slug = String(params.slug);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const session = loadSession();
    if (!session) {
      setError("No session — create fund from this browser first");
      return;
    }
    const form = new FormData(e.currentTarget);
    const client = new CoordinatorBackend({
      baseUrl: COORDINATOR_URL,
      fundId: session.fundId,
      apiKey: session.apiKey,
      fundSlug: session.fundSlug,
    });
    try {
      const proposal = await client.createProposal(
        session.fundId,
        {
          proposal_type: form.get("proposal_type") as never,
          title: String(form.get("title")),
          description: String(form.get("description")),
          payload: {},
        },
        session.memberId,
      );
      await client.activateProposal(proposal.id, session.memberId);
      router.push(`/f/${slug}/proposals/${proposal.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }

  return (
    <div>
      <h1>New proposal</h1>
      <form onSubmit={handleSubmit} className="card">
        <label>Type</label>
        <select name="proposal_type" defaultValue="general">
          <option value="general">General</option>
          <option value="spend_intent">Spend intent</option>
          <option value="gleyo_link">Gleyo link</option>
          <option value="constitution_amend">Constitution amend</option>
        </select>
        <label>Title</label>
        <input name="title" required />
        <label>Description</label>
        <textarea name="description" required rows={4} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Create &amp; activate</button>
      </form>
    </div>
  );
}
