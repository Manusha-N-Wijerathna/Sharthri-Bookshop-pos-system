import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, { max: 1, connect_timeout: 10 });

async function check() {
  try {
    console.log("Checking pg_stat_activity...");
    const activities = await sql`
      SELECT pid, usename, state, query, age(clock_timestamp(), query_start) as age, wait_event_type, wait_event
      FROM pg_stat_activity
      WHERE state != 'idle' AND pid <> pg_backend_pid();
    `;
    console.log("Active queries:", activities);

    console.log("Testing select count(*) from products...");
    const [{ count }] = await sql`SELECT count(*) FROM products;`;
    console.log("Products count:", count);

    console.log("Testing select * from products limit 5...");
    const prods = await sql`SELECT id, title, is_active FROM products LIMIT 5;`;
    console.log("Sample products:", prods);

    process.exit(0);
  } catch (err) {
    console.error("Check error:", err);
    process.exit(1);
  }
}

check();

