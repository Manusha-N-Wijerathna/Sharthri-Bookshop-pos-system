import { auth } from "@/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("barcode")?.trim();
  const query = searchParams.get("q")?.trim();

  try {
    // 1. Exact barcode (ISBN or SKU) match for scanner (active products only)
    if (barcode) {
      const [matchedProduct] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            or(eq(products.isbn, barcode), eq(products.sku, barcode))
          )
        )
        .limit(1);

      if (!matchedProduct) {
        return NextResponse.json(
          { error: `No active product found for barcode: ${barcode}` },
          { status: 404 }
        );
      }

      return NextResponse.json({ product: matchedProduct });
    }

    // 2. Fuzzy search for manual product search fallback (active products only)
    if (query) {
      const searchPattern = `%${query}%`;
      const matches = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            or(
              ilike(products.title, searchPattern),
              ilike(products.author, searchPattern),
              ilike(products.isbn, searchPattern),
              ilike(products.sku, searchPattern),
              ilike(products.category, searchPattern)
            )
          )
        )
        .orderBy(desc(products.updatedAt))
        .limit(20);

      return NextResponse.json({ products: matches });
    }

    // 3. If neither, return top active inventory items
    const topProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.updatedAt))
      .limit(20);

    return NextResponse.json({ products: topProducts });
  } catch (error: any) {
    console.error("Product lookup failed:", error);
    return NextResponse.json(
      { error: "Failed to look up product" },
      { status: 500 }
    );
  }
}
