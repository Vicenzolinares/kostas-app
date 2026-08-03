import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://kostas:kostas@localhost:5432/kostas_dev";

// A single shared connection pool per server process. In dev with hot
// reload, stash it on globalThis so we don't leak connections.
const globalForDb = globalThis as unknown as {
  __kostasPgClient?: postgres.Sql;
};

const queryClient =
  globalForDb.__kostasPgClient ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__kostasPgClient = queryClient;
}

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
