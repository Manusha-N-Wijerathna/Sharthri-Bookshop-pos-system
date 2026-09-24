import { auth } from "@/auth";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { updateProductSchema } from "@/lib/validations/product";
import { and, desc, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch recent stock movements for this product
    const movements = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt))
      .limit(20);

    return NextResponse.json({ product, movements });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const json = await req.json();
    const validatedData = updateProductSchema.parse(json);

    // Verify product exists
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check duplicate ISBN on other products
    if (validatedData.isbn) {
      const [duplicateIsbn] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.isbn, validatedData.isbn),
            ne(products.id, productId)
          )
        )
        .limit(1);

      if (duplicateIsbn) {
        return NextResponse.json(
          { error: "Another product with this ISBN already exists" },
          { status: 400 }
        );
      }
    }

    // Check duplicate SKU on other products
    if (validatedData.sku) {
      const [duplicateSku] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.sku, validatedData.sku),
            ne(products.id, productId)
          )
        )
        .limit(1);

      if (duplicateSku) {
        return NextResponse.json(
          { error: "Another product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(products)
      .set({
        title: validatedData.title,
        author: validatedData.author || null,
        isbn: validatedData.isbn || null,
        sku: validatedData.sku || null,
        category: validatedData.category || null,
        price: validatedData.price,
        cost: validatedData.cost || null,
        reorderThreshold: validatedData.reorderThreshold,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}
