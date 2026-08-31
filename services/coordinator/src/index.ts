import Fastify, { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import pg from "pg";
import { CoordinatorStore } from "./store.js";
import { runMigrations } from "./migrate.js";

const PORT = Number(process.env.PORT ?? 8787);
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://zcashorg:zcashorg@localhost:5432/zcashorg";

type AuthedRequest = FastifyRequest & { fundId?: string };

function isPublicRoute(method: string, url: string): boolean {
  if (url === "/health") return true;
  if (method === "GET" && /^\/v1\/funds\/[^/]+$/.test(url)) return true;
  if (method === "GET" && /^\/v1\/funds\/[^/]+\/proposals$/.test(url)) return true;
  if (method === "GET" && /^\/v1\/funds\/[^/]+\/events$/.test(url)) return true;
  if (method === "GET" && /^\/v1\/proposals\/[^/]+$/.test(url)) return true;
  if (method === "POST" && url === "/v1/funds") return true;
  if (method === "POST" && /^\/v1\/invites\/[^/]+\/accept$/.test(url)) return true;
  if (method === "POST" && /^\/v1\/proposals\/[^/]+\/votes$/.test(url)) return true;
  return false;
}

async function main() {
  await runMigrations(DATABASE_URL);
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const store = new CoordinatorStore(pool);

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  app.addHook("preHandler", async (req, reply) => {
    const url = req.url.split("?")[0] ?? req.url;
    if (isPublicRoute(req.method, url)) return;

    const fundId = req.headers["x-fund-id"];
    const apiKey = req.headers["x-fund-api-key"];
    if (typeof fundId !== "string" || typeof apiKey !== "string") {
      return reply.code(401).send({ error: "missing fund credentials" });
    }
    const ok = await store.verifyFundApiKey(fundId, apiKey);
    if (!ok) return reply.code(401).send({ error: "invalid fund credentials" });
    (req as AuthedRequest).fundId = fundId;
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/v1/funds/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const fund = await store.getFundBySlug(slug);
    if (!fund) return reply.code(404).send({ error: "fund not found" });
    const [members, treasury, governance] = await Promise.all([
      store.listMembers(fund.id),
      store.getTreasury(fund.id),
      store.getGovernanceConfig(fund.id),
    ]);
    return { fund, members, treasury, governance };
  });

  app.get("/v1/funds/:slug/proposals", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const fund = await store.getFundBySlug(slug);
    if (!fund) return reply.code(404).send({ error: "fund not found" });
    return { proposals: await store.listProposals(fund.id) };
  });

  app.get("/v1/funds/:slug/events", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const fund = await store.getFundBySlug(slug);
    if (!fund) return reply.code(404).send({ error: "fund not found" });
    return { events: await store.listEvents(fund.id) };
  });

  app.get("/v1/proposals/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const proposal = await store.getProposal(id);
    if (!proposal) return reply.code(404).send({ error: "proposal not found" });
    return { proposal, votes: await store.listVotes(id) };
  });

  app.post("/v1/funds", async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    if (
      !body.slug ||
      !body.display_name ||
      !body.fund_type ||
      !body.network ||
      !body.owner_display_name ||
      !body.shielded_ua
    ) {
      return reply.code(400).send({ error: "missing required fields" });
    }
    try {
      const result = await store.createFund({
        slug: String(body.slug),
        display_name: String(body.display_name),
        fund_type: body.fund_type as never,
        description: body.description ? String(body.description) : undefined,
        network: body.network as never,
        zns_name: body.zns_name ? String(body.zns_name) : undefined,
        owner_display_name: String(body.owner_display_name),
        shielded_ua: String(body.shielded_ua),
        receive_ua: body.receive_ua ? String(body.receive_ua) : undefined,
        constitution_hash: body.constitution_hash
          ? String(body.constitution_hash)
          : undefined,
        constitution_text_uri: body.constitution_text_uri
          ? String(body.constitution_text_uri)
          : undefined,
        private_ordering_ack: body.private_ordering_ack !== false,
      });
      return reply.code(201).send(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "create failed";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        return reply.code(409).send({ error: "slug already exists" });
      }
      throw e;
    }
  });

  app.post("/v1/funds/:fundId/invites", async (req, reply) => {
    const authFundId = (req as AuthedRequest).fundId;
    const { fundId } = req.params as { fundId: string };
    if (authFundId !== fundId) return reply.code(403).send({ error: "forbidden" });

    const body = req.body as { role?: string; expires_in_hours?: number };
    const result = await store.createInvite(
      fundId,
      (body.role ?? "member") as never,
      body.expires_in_hours,
    );
    return reply.code(201).send(result);
  });

  app.post("/v1/invites/:token/accept", async (req, reply) => {
    const { token } = req.params as { token: string };
    const body = req.body as Record<string, unknown>;
    if (!body.shielded_ua || !body.display_name) {
      return reply.code(400).send({ error: "shielded_ua and display_name required" });
    }
    try {
      const result = await store.acceptInvite(token, {
        shielded_ua: String(body.shielded_ua),
        display_name: String(body.display_name),
        private_ordering_ack: body.private_ordering_ack !== false,
      });
      return reply.code(201).send(result);
    } catch (e: unknown) {
      return reply.code(400).send({
        error: e instanceof Error ? e.message : "accept failed",
      });
    }
  });

  app.post("/v1/funds/:fundId/proposals", async (req, reply) => {
    const authFundId = (req as AuthedRequest).fundId;
    const { fundId } = req.params as { fundId: string };
    if (authFundId !== fundId) return reply.code(403).send({ error: "forbidden" });

    const body = req.body as Record<string, unknown>;
    if (!body.title || !body.description || !body.proposal_type || !body.member_id) {
      return reply.code(400).send({ error: "missing fields" });
    }
    const proposal = await store.createProposal(fundId, {
      proposal_type: body.proposal_type as never,
      title: String(body.title),
      description: String(body.description),
      payload: (body.payload as Record<string, unknown>) ?? {},
      created_by_member_id: String(body.member_id),
    });
    return reply.code(201).send({ proposal });
  });

  app.post("/v1/proposals/:id/activate", async (req, reply) => {
    const { id } = req.params as { id: string };
    const proposal = await store.getProposal(id);
    if (!proposal) return reply.code(404).send({ error: "not found" });
    const authFundId = (req as AuthedRequest).fundId;
    if (authFundId && authFundId !== proposal.fund_id) {
      return reply.code(403).send({ error: "forbidden" });
    }
    try {
      return { proposal: await store.activateProposal(id) };
    } catch (e: unknown) {
      return reply.code(400).send({
        error: e instanceof Error ? e.message : "activate failed",
      });
    }
  });

  app.post("/v1/proposals/:id/votes", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    if (!body.member_id || !body.choice) {
      return reply.code(400).send({ error: "member_id and choice required" });
    }
    try {
      const vote = await store.castVote({
        proposal_id: id,
        member_id: String(body.member_id),
        choice: body.choice as never,
        attestation: body.attestation as never,
      });
      return reply.code(201).send({ vote });
    } catch (e: unknown) {
      return reply.code(400).send({
        error: e instanceof Error ? e.message : "vote failed",
      });
    }
  });

  app.post("/v1/proposals/:id/finalize", async (req, reply) => {
    const { id } = req.params as { id: string };
    const proposal = await store.getProposal(id);
    if (!proposal) return reply.code(404).send({ error: "not found" });
    const authFundId = (req as AuthedRequest).fundId;
    if (authFundId && authFundId !== proposal.fund_id) {
      return reply.code(403).send({ error: "forbidden" });
    }
    try {
      return { proposal: await store.finalizeProposal(id) };
    } catch (e: unknown) {
      return reply.code(400).send({
        error: e instanceof Error ? e.message : "finalize failed",
      });
    }
  });

  app.post("/v1/proposals/:id/execute", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const proposal = await store.getProposal(id);
    if (!proposal) return reply.code(404).send({ error: "not found" });
    const authFundId = (req as AuthedRequest).fundId;
    if (authFundId && authFundId !== proposal.fund_id) {
      return reply.code(403).send({ error: "forbidden" });
    }
    if (!body.txid || !body.execution_member_id) {
      return reply.code(400).send({ error: "txid and execution_member_id required" });
    }
    try {
      return {
        proposal: await store.recordExecution(
          id,
          String(body.txid),
          String(body.execution_member_id),
        ),
      };
    } catch (e: unknown) {
      return reply.code(400).send({
        error: e instanceof Error ? e.message : "execute failed",
      });
    }
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Coordinator listening on :${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
