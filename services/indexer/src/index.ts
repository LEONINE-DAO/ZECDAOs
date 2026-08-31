import Fastify from "fastify";
import cors from "@fastify/cors";

/** Stub indexer for zk-CosmWasm contract events — Phase 1b. */
const executionGates = new Map<string, { may_execute: boolean }>();

const PORT = Number(process.env.INDEXER_PORT ?? 8788);

async function main() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ ok: true, service: "indexer" }));

  app.get("/may_execute/:proposalId", async (req) => {
    const { proposalId } = req.params as { proposalId: string };
    const gate = executionGates.get(proposalId);
    return { may_execute: gate?.may_execute ?? true };
  });

  app.post("/sync/proposal", async (req) => {
    const body = req.body as {
      on_chain_proposal_id: string;
      status: string;
      may_execute?: boolean;
    };
    executionGates.set(body.on_chain_proposal_id, {
      may_execute: body.may_execute ?? body.status === "passed",
    });
    return { ok: true };
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Indexer stub listening on :${PORT}`);
}

main().catch(console.error);
