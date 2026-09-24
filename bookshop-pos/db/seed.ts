import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products, users } from "./schema";

async function seed() {
  console.log("Seeding database...");

  const sampleProducts = [
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
  ];

  for (const prod of sampleProducts) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.isbn, prod.isbn))
      .limit(1);

    if (!existing) {
      await db.insert(products).values(prod);
      console.log(`Inserted product: ${prod.title}`);
    }
  }

  const adminPassword = await hash("admin123", 10);
  const cashierPassword = await hash("cashier123", 10);

  // Admin user
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "owner@example.com"))
    .limit(1);

  if (existingAdmin) {
    await db
      .update(users)
      .set({ passwordHash: adminPassword, name: "Shop Owner", role: "admin" })
      .where(eq(users.email, "owner@example.com"));
    console.log("Updated admin user password.");
  } else {
    await db.insert(users).values({
      name: "Shop Owner",
      email: "owner@example.com",
      passwordHash: adminPassword,
      role: "admin",
    });
    console.log("Inserted admin user.");
  }

  // Cashier user
  const [existingCashier] = await db
    .select()
    .from(users)
    .where(eq(users.email, "cashier@example.com"))
    .limit(1);

  if (existingCashier) {
    await db
      .update(users)
      .set({ passwordHash: cashierPassword, name: "Cashier One", role: "cashier" })
      .where(eq(users.email, "cashier@example.com"));
    console.log("Updated cashier user password.");
  } else {
    await db.insert(users).values({
      name: "Cashier One",
      email: "cashier@example.com",
      passwordHash: cashierPassword,
      role: "cashier",
    });
    console.log("Inserted cashier user.");
  }

  console.log("---");
  console.log("Seed complete! Credentials:");
  console.log("Admin:   owner@example.com / admin123");
  console.log("Cashier: cashier@example.com / cashier123");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
