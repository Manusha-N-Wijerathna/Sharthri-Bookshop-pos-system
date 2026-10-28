import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { products, users } from "./schema";

async function seed() {
  console.log("Seeding database with stationery and food items...");

  const sampleProducts = [
    {
      title: "Atlas CR Book 120 Pages Single Rule",
      author: "Atlas",
      isbn: "4792024001011",
      sku: "CR-120-SR",
      category: "Writing Books (CR, B5, XE)",
      price: "280.00",
      cost: "220.00",
      quantity: 25,
      reorderThreshold: 5,
    },
    {
      title: "Atlas B5 Book 120 Pages Single Rule",
      author: "Atlas",
      isbn: "4792024001028",
      sku: "B5-120-SR",
      category: "Writing Books (CR, B5, XE)",
      price: "220.00",
      cost: "170.00",
      quantity: 18,
      reorderThreshold: 5,
    },
    {
      title: "Atlas Exercise (XE) Book 80 Pages Single Rule",
      author: "Atlas",
      isbn: "4792024001035",
      sku: "XE-80-SR",
      category: "Writing Books (CR, B5, XE)",
      price: "140.00",
      cost: "105.00",
      quantity: 30,
      reorderThreshold: 8,
    },
    {
      title: "Atlas Chooty Ballpoint Pen (Blue 0.7mm)",
      author: "Atlas",
      isbn: "4792024002018",
      sku: "PEN-BLUE-01",
      category: "Pens & Writing",
      price: "30.00",
      cost: "22.00",
      quantity: 50,
      reorderThreshold: 15,
    },
    {
      title: "Munchee Chocolate Puff 100g",
      author: "Munchee",
      isbn: "4792024003015",
      sku: "SNK-CHOC-100",
      category: "Food & Snacks",
      price: "180.00",
      cost: "150.00",
      quantity: 4, // low stock for testing alert
      reorderThreshold: 6,
    },
    {
      title: "Elephant House Ginger Beer (EGB) 300ml",
      author: "Elephant House",
      isbn: "4792024004012",
      sku: "BEV-EGB-300",
      category: "Beverages",
      price: "150.00",
      cost: "120.00",
      quantity: 12,
      reorderThreshold: 5,
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
