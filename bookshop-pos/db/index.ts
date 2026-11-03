import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.NODE_ENV === "production" && typeof window === "undefined") {
  console.warn("⚠️ DATABASE_URL is not set in environment variables. Ensure it is configured in Vercel project settings.");
}

// Global singleton to prevent connection leaks across Next.js dev server hot-reloads.
const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
};

// Fallback dummy connection string for build-time static evaluation
const connectionString = dbUrl || "postgres://postgres:postgres@127.0.0.1:5432/postgres";

const queryClient =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false, // Required for Supabase PgBouncer transaction mode (port 6543)
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = queryClient;
}

export const db = drizzle(queryClient, { schema });
