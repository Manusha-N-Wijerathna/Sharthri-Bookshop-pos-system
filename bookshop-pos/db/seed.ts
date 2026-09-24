import { db } from "./index";
import { products, users } from "./schema";

async function seed() {
  console.log("Seeding database...");

  await db.insert(products).values([
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isbn: "9780547928227",
      category: "Fiction",
      price: "1500.00",
      cost: "900.00",
      quantity: 12,
      reorderThreshold: 3,
    },
    {
      title: "Sapiens",
      author: "Yuval Noah Harari",
      isbn: "9780062316097",
      category: "Non-fiction",
      price: "2200.00",
      cost: "1400.00",
      quantity: 5,
      reorderThreshold: 3,
    },
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "9780132350884",
      category: "Technology",
      price: "3200.00",
      cost: "2000.00",
      quantity: 2, // intentionally low, for testing low-stock alerts
      reorderThreshold: 3,
    },
  ]);

  // NOTE: replace this password hash before real use — this is just a placeholder
  // for local dev. Generate a real one with bcrypt once auth (Phase 2) is set up.
  await db.insert(users).values([
    {
      name: "Shop Owner",
      email: "owner@example.com",
      passwordHash: "REPLACE_ME_WITH_REAL_HASH",
      role: "admin",
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
