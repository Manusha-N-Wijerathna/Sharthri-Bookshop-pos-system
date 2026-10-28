import { auth } from "@/auth";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { createProductSchema } from "@/lib/validations/product";
import { and, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();
  const lowStock = searchParams.get("lowStock") === "true";
  const status = searchParams.get("status") || "active"; // "active" | "archived" | "all"

  const conditions = [];

  if (status === "active") {
    conditions.push(eq(products.isActive, true));
  } else if (status === "archived") {
    conditions.push(eq(products.isActive, false));
  }

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(products.title, searchPattern),
        ilike(products.author, searchPattern),
        ilike(products.isbn, searchPattern),
        ilike(products.sku, searchPattern),
        ilike(products.category, searchPattern)
      )
    );
  }

  if (category && category !== "all") {
    conditions.push(eq(products.category, category));
  }

  if (lowStock) {
    conditions.push(lte(products.quantity, products.reorderThreshold));
  }

  try {
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const items = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.updatedAt), desc(products.id));

    // Also get distinct categories for filter dropdown
    let categories: string[] = [];
    try {
      const categoriesResult = await db
        .selectDistinct({ category: products.category })
        .from(products)
        .where(sql`${products.category} IS NOT NULL AND ${products.category} != ''`);

      categories = categoriesResult
        .map((c) => c.category)
        .filter((c): c is string => Boolean(c))
        .sort();
    } catch {
      // Graceful fallback: extract distinct categories directly from items
      categories = Array.from(
        new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))
      ).sort();
    }

    return NextResponse.json({ products: items, categories });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  try {
    const json = await req.json();
    const validatedData = createProductSchema.parse(json);

    const initialQuantity = validatedData.quantity;

    // Check unique Barcode / ISBN if provided
    if (validatedData.isbn) {
      const [existingIsbn] = await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .where(eq(products.isbn, validatedData.isbn))
        .limit(1);

      if (existingIsbn) {
        return NextResponse.json(
          {
            error: `An item with Barcode "${validatedData.isbn}" already exists ("${existingIsbn.title}"). Barcodes must be unique or left blank.`,
          },
          { status: 400 }
        );
      }
    }

    // Check unique SKU if provided
    if (validatedData.sku) {
      const [existingSku] = await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .where(eq(products.sku, validatedData.sku))
        .limit(1);

      if (existingSku) {
        return NextResponse.json(
          {
            error: `An item with SKU/Code "${validatedData.sku}" already exists ("${existingSku.title}"). Please choose another code or leave it blank.`,
          },
          { status: 400 }
        );
      }
    }

    // Run transaction if initialQuantity > 0, ensuring stock_movements row is inserted
    const result = await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(products)
        .values({
          title: validatedData.title,
          author: validatedData.author || null,
          isbn: validatedData.isbn || null,
          sku: validatedData.sku || null,
          category: validatedData.category || null,
          price: validatedData.price,
          cost: validatedData.cost || null,
          quantity: initialQuantity,
          reorderThreshold: validatedData.reorderThreshold,
          isActive: true,
        })
        .returning();

      if (initialQuantity > 0) {
        await tx.insert(stockMovements).values({
          productId: newProduct.id,
          change: initialQuantity,
          reason: "restock",
          note: "Initial stock on product creation",
        });
      }

      return newProduct;
    });

    return NextResponse.json({ product: result }, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      const firstIssue = error.issues?.[0] || error.errors?.[0];
      const field = firstIssue?.path?.join(".") || "field";
      const msg = firstIssue?.message || "Validation error";
      return NextResponse.json(
        {
          error: `${msg} (${field})`,
          details: error.issues || error.errors,
        },
        { status: 400 }
      );
    }
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
