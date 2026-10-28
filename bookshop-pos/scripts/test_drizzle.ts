import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { eq, desc } from "drizzle-orm";

async function test() {
  console.log("Testing with prepare: false...");
  const client = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: 5,
  });
  const db = drizzle(client, { schema });

  const start = Date.now();
  const items = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.isActive, true))
    .orderBy(desc(schema.products.updatedAt), desc(schema.products.id));

  console.log(`Fetched ${items.length} items in ${Date.now() - start}ms`);
  console.log("First item:", items[0]?.title);
  process.exit(0);
}

test().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

