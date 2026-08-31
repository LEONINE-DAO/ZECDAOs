import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return `zorg_${randomBytes(32).toString("hex")}`;
}

export async function runMigrations(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const sql = readFileSync(
      join(__dirname, "../migrations/001_initial.sql"),
      "utf8",
    );
    await client.query(sql);
    console.log("Migrations applied.");
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1]?.endsWith("migrate.ts") ||
  process.argv[1]?.endsWith("migrate.js");

if (isMain) {
  const url =
    process.env.DATABASE_URL ??
    "postgres://zcashorg:zcashorg@localhost:5432/zcashorg";
  runMigrations(url).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
