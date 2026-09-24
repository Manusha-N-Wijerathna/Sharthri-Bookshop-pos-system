import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------

export const userRoleEnum = pgEnum("user_role", ["admin", "cashier"]);

export const stockMovementReasonEnum = pgEnum("stock_movement_reason", [
  "sale",       // stock decreased because of a sale
  "restock",    // stock increased, new inventory arrived
  "adjustment", // manual correction (damage, loss, stocktake fix)
  "return",     // customer returned an item
]);

// ---------- Users ----------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("cashier"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Products ----------

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    author: varchar("author", { length: 255 }),
    isbn: varchar("isbn", { length: 20 }), // nullable: secondhand/local books may not have one
    sku: varchar("sku", { length: 50 }), // internal code, used if no barcode/ISBN
    category: varchar("category", { length: 100 }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(), // sell price
    cost: numeric("cost", { precision: 10, scale: 2 }), // purchase cost, optional, for margin reports
    quantity: integer("quantity").notNull().default(0), // current stock on hand
    reorderThreshold: integer("reorder_threshold").notNull().default(3), // "low stock" trigger point
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    isbnIdx: uniqueIndex("products_isbn_idx").on(table.isbn),
    skuIdx: uniqueIndex("products_sku_idx").on(table.sku),
  })
);

// ---------- Sales (one row per checkout/transaction) ----------

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  cashierId: integer("cashier_id")
    .notNull()
    .references(() => users.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Sale line items (one row per product per sale) ----------
// Never overwrite these after creation — they're the source of truth for analytics.

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(), // price AT time of sale, don't join to products.price later
});

// ---------- Stock movement log (audit trail for every quantity change) ----------
// products.quantity is a cached/derived value. This table is the real history.

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  change: integer("change").notNull(), // positive = added, negative = removed
  reason: stockMovementReasonEnum("reason").notNull(),
  relatedSaleId: integer("related_sale_id").references(() => sales.id), // set when reason = 'sale'
  note: text("note"), // free text, e.g. "water damage" for adjustments
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Relations (for Drizzle's query API) ----------

export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems),
  stockMovements: many(stockMovements),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  cashier: one(users, { fields: [sales.cashierId], references: [users.id] }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  sale: one(sales, { fields: [stockMovements.relatedSaleId], references: [sales.id] }),
}));
