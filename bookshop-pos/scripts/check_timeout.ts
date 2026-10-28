import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function run() {
  const [res] = await sql`SHOW statement_timeout;`;
  console.log("statement_timeout:", res);
  const [lockTimeout] = await sql`SHOW lock_timeout;`;
  console.log("lock_timeout:", lockTimeout);
  const [idleInTx] = await sql`SHOW idle_in_transaction_session_timeout;`;
  console.log("idle_in_transaction_session_timeout:", idleInTx);
  process.exit(0);
}

run();

