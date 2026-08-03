import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://kostas:kostas@localhost:5432/kostas_dev";

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  console.log(`Running migrations against ${connectionString}...`);
  // Module 12 (AI Photo Search) uses pgvector's `vector` column type. The
  // extension ships with the pgvector/pgvector:pgN image but isn't
  // enabled per-database automatically — do it here rather than baking
  // it into a generated migration file, which is regenerated wholesale
  // (not appended to) whenever the schema changes.
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
