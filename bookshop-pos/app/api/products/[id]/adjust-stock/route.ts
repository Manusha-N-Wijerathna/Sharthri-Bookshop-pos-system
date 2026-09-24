import { auth } from "@/auth";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { adjustStockSchema } from "@/lib/validations/product";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
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
    const validatedData = adjustStockSchema.parse(json);

    const result = await db.transaction(async (tx) => {
      // 1. Fetch current product within transaction
      const [currentProduct] = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!currentProduct) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const newQuantity = currentProduct.quantity + validatedData.change;
      if (newQuantity < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // 2. Update product stock quantity
      const [updatedProduct] = await tx
        .update(products)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))
        .returning();

      // 3. Insert audit stock movement
      const [movement] = await tx
        .insert(stockMovements)
        .values({
          productId: productId,
          change: validatedData.change,
          reason: validatedData.reason,
          note: validatedData.note || null,
        })
        .returning();

      return { product: updatedProduct, movement };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error?.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (error?.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Stock cannot be reduced below 0" },
        { status: 400 }
      );
    }
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to adjust stock:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
