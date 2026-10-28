import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local file.");
}

// Global singleton to prevent connection leaks across Next.js dev server hot-reloads.
// prepare: false is required for Supabase transaction pooler (port 6543 / PgBouncer).
const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
};

const queryClient =
  globalForDb.conn ??
  postgres(process.env.DATABASE_URL, {
    prepare: false, // Required for Supabase PgBouncer transaction mode (port 6543)
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = queryClient;
}

export const db = drizzle(queryClient, { schema });
