import postgres from "postgres";
import * as dotenv from "dotenv";
import { hash } from "bcryptjs";

dotenv.config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  prepare: false,
  connect_timeout: 10,
});

async function reset() {
  console.log("Resetting database...");

  try {
    // 1. Truncate transactional tables and products with cascade
    console.log("Truncating tables: sale_items, stock_movements, sales, products...");
    await sql`TRUNCATE TABLE sale_items, stock_movements, sales, products RESTART IDENTITY CASCADE;`;
    console.log("Tables truncated and ID sequences reset.");

    // 2. Insert fresh products
    const sampleProducts = [
      {
        title: "Atlas CR Book 120 Pages Single Rule",
        author: "Atlas",
        isbn: "4792024001011",
        sku: "CR-120-SR",
        category: "Writing books",
        price: "280.00",
        cost: "220.00",
        quantity: 25,
        reorder_threshold: 5,
        is_active: true,
      },
      {
        title: "Atlas B5 Book 120 Pages Single Rule",
        author: "Atlas",
        isbn: "4792024001028",
        sku: "B5-120-SR",
        category: "Writing books",
        price: "220.00",
        cost: "170.00",
        quantity: 18,
        reorder_threshold: 5,
        is_active: true,
      },
      {
        title: "Atlas Exercise (XE) Book 80 Pages Single Rule",
        author: "Atlas",
        isbn: "4792024001035",
        sku: "XE-80-SR",
        category: "Writing books",
        price: "140.00",
        cost: "105.00",
        quantity: 30,
        reorder_threshold: 8,
        is_active: true,
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
        reorder_threshold: 15,
        is_active: true,
      },
      {
        title: "Munchee Chocolate Puff 100g",
        author: "Munchee",
        isbn: "4792024003015",
        sku: "SNK-CHOC-100",
        category: "Food & Snacks",
        price: "180.00",
        cost: "150.00",
        quantity: 15,
        reorder_threshold: 6,
        is_active: true,
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
        reorder_threshold: 5,
        is_active: true,
      },
    ];

    console.log("Inserting fresh inventory items...");
    for (const prod of sampleProducts) {
      const [inserted] = await sql`
        INSERT INTO products (title, author, isbn, sku, category, price, cost, quantity, reorder_threshold, is_active)
        VALUES (${prod.title}, ${prod.author}, ${prod.isbn}, ${prod.sku}, ${prod.category}, ${prod.price}, ${prod.cost}, ${prod.quantity}, ${prod.reorder_threshold}, ${prod.is_active})
        RETURNING id, title, quantity;
      `;

      // Log initial stock movement
      await sql`
        INSERT INTO stock_movements (product_id, change, reason, note)
        VALUES (${inserted.id}, ${inserted.quantity}, 'restock', 'Initial inventory setup');
      `;
      console.log(`- Inserted "${inserted.title}" (ID: ${inserted.id}, Stock: ${inserted.quantity})`);
    }

    // 3. Ensure Users exist
    console.log("Ensuring admin and cashier users exist...");
    const adminPassword = await hash("admin123", 10);
    const cashierPassword = await hash("cashier123", 10);

    const [adminUser] = await sql`SELECT id FROM users WHERE email = 'owner@example.com';`;
    if (adminUser) {
      await sql`
        UPDATE users 
        SET password_hash = ${adminPassword}, name = 'Shop Owner', role = 'admin'
        WHERE email = 'owner@example.com';
      `;
      console.log("Admin user credentials updated.");
    } else {
      await sql`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ('Shop Owner', 'owner@example.com', ${adminPassword}, 'admin');
      `;
      console.log("Admin user created.");
    }

    const [cashierUser] = await sql`SELECT id FROM users WHERE email = 'cashier@example.com';`;
    if (cashierUser) {
      await sql`
        UPDATE users 
        SET password_hash = ${cashierPassword}, name = 'Cashier One', role = 'cashier'
        WHERE email = 'cashier@example.com';
      `;
      console.log("Cashier user credentials updated.");
    } else {
      await sql`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ('Cashier One', 'cashier@example.com', ${cashierPassword}, 'cashier');
      `;
      console.log("Cashier user created.");
    }

    console.log("\n=================================");
    console.log("DATABASE RESET SUCCESSFULLY COMPLETED!");
    console.log("Admin login:   owner@example.com / admin123");
    console.log("Cashier login: cashier@example.com / cashier123");
    console.log("=================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Database reset error:", err);
    process.exit(1);
  }
}

reset();

