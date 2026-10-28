import { auth } from "@/auth";
import { db } from "@/db";
import { products, saleItems, sales, stockMovements } from "@/db/schema";
import { createSaleSchema } from "@/lib/validations/sale";
import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

// Cache for idempotency keys to reject duplicate rapid submissions
interface IdempotencyRecord {
  status: "in-progress" | "completed";
  createdAt: number;
  response?: any;
}

const idempotencyCache = new Map<string, IdempotencyRecord>();

// Clean up expired keys every 5 minutes (TTL: 2 minutes)
const IDEMPOTENCY_TTL_MS = 2 * 60 * 1000;
function cleanExpiredKeys() {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to complete sales." },
      { status: 401 }
    );
  }

  const cashierId = parseInt(session.user.id, 10);
  if (isNaN(cashierId)) {
    return NextResponse.json({ error: "Invalid cashier ID" }, { status: 400 });
  }

  cleanExpiredKeys();

  try {
    const json = await req.json();
    const validatedData = createSaleSchema.parse(json);

    const idempotencyKey = validatedData.idempotencyKey;

    // Check duplicate rapid submission
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached) {
        if (cached.status === "in-progress") {
          return NextResponse.json(
            { error: "Checkout already processing. Please do not double-submit." },
            { status: 409 }
          );
        }
        if (cached.status === "completed" && cached.response) {
          return NextResponse.json(cached.response, { status: 200 });
        }
      }
      idempotencyCache.set(idempotencyKey, {
        status: "in-progress",
        createdAt: Date.now(),
      });
    }

    // 1. Group and sum requested quantities by productId
    const requestedQtyMap = new Map<number, number>();
    for (const item of validatedData.items) {
      const current = requestedQtyMap.get(item.productId) || 0;
      requestedQtyMap.set(item.productId, current + item.quantity);
    }

    const sortedProductIds = Array.from(requestedQtyMap.keys()).sort((a, b) => a - b);

    // 2. Open ONE DB transaction
    const result = await db.transaction(async (tx) => {
      // 2a. Lock product rows in deterministic order to prevent deadlocks
      const lockedProducts = await tx
        .select()
        .from(products)
        .where(inArray(products.id, sortedProductIds))
        .for("update");

      // Verify all requested products exist
      if (lockedProducts.length !== sortedProductIds.length) {
        const foundIds = new Set(lockedProducts.map((p) => p.id));
        const missingId = sortedProductIds.find((id) => !foundIds.has(id));
        throw new Error(`PRODUCT_NOT_FOUND:${missingId}`);
      }

      // 2b. Check stock availability for each item
      for (const prod of lockedProducts) {
        const requested = requestedQtyMap.get(prod.id)!;
        if (prod.quantity < requested) {
          throw new Error(
            `INSUFFICIENT_STOCK:${prod.title}:${requested}:${prod.quantity}`
          );
        }
      }

      // 2c. Compute total server-side from DB prices (never trust client)
      let grandTotalCents = 0;
      for (const prod of lockedProducts) {
        const requested = requestedQtyMap.get(prod.id)!;
        const unitPriceCents = Math.round(parseFloat(prod.price) * 100);
        grandTotalCents += unitPriceCents * requested;
      }
      const grandTotalStr = (grandTotalCents / 100).toFixed(2);

      // 2d. Decrement stock for each product
      for (const prod of lockedProducts) {
        const requested = requestedQtyMap.get(prod.id)!;
        const newQuantity = prod.quantity - requested;
        await tx
          .update(products)
          .set({
            quantity: newQuantity,
            updatedAt: new Date(),
          })
          .where(eq(products.id, prod.id));
      }

      // 2e. Insert sales record
      const [saleRecord] = await tx
        .insert(sales)
        .values({
          cashierId,
          total: grandTotalStr,
        })
        .returning();

      // 2f. Insert sale_items records (price frozen at time of sale)
      const saleItemsToInsert = lockedProducts.map((prod) => {
        const qty = requestedQtyMap.get(prod.id)!;
        return {
          saleId: saleRecord.id,
          productId: prod.id,
          quantity: qty,
          unitPrice: prod.price,
        };
      });

      const insertedSaleItems = await tx
        .insert(saleItems)
        .values(saleItemsToInsert)
        .returning();

      // 2g. Insert stock_movements records (reason = 'sale', relatedSaleId = sale.id)
      const stockMovementsToInsert = lockedProducts.map((prod) => {
        const qty = requestedQtyMap.get(prod.id)!;
        return {
          productId: prod.id,
          change: -qty, // negative for sale
          reason: "sale" as const,
          relatedSaleId: saleRecord.id,
          note: `Sale #${saleRecord.id}`,
        };
      });

      await tx.insert(stockMovements).values(stockMovementsToInsert);

      // Construct item summary for response / receipt
      const receiptItems = insertedSaleItems.map((item) => {
        const prod = lockedProducts.find((p) => p.id === item.productId)!;
        const lineTotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
        return {
          id: item.id,
          productId: item.productId,
          title: prod.title,
          author: prod.author,
          isbn: prod.isbn,
          sku: prod.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
        };
      });

      return {
        sale: {
          id: saleRecord.id,
          cashierId: saleRecord.cashierId,
          cashierName: session.user.name || "Cashier",
          total: saleRecord.total,
          createdAt: saleRecord.createdAt,
        },
        items: receiptItems,
      };
    });

    // Mark idempotency key as completed
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        status: "completed",
        createdAt: Date.now(),
        response: result,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    // If idempotency was in progress, remove it on error so retry is permitted
    const jsonBody = req.body;
    try {
      if (typeof jsonBody === "object" && (jsonBody as any)?.idempotencyKey) {
        idempotencyCache.delete((jsonBody as any).idempotencyKey);
      }
    } catch {
      // ignore
    }

    if (error?.name === "ZodError") {
      return NextResponse.json(
        {
          error: error.errors?.[0]?.message || "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error?.message?.startsWith("INSUFFICIENT_STOCK:")) {
      const [, title, requested, available] = error.message.split(":");
      return NextResponse.json(
        {
          error: `Insufficient stock for "${title}". Requested: ${requested}, Available: ${available}`,
          insufficientItem: { title, requested: Number(requested), available: Number(available) },
        },
        { status: 400 }
      );
    }

    if (error?.message?.startsWith("PRODUCT_NOT_FOUND:")) {
      const [, missingId] = error.message.split(":");
      return NextResponse.json(
        { error: `Product ID ${missingId} does not exist in inventory` },
        { status: 404 }
      );
    }

    console.error("Sale checkout transaction failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process sale. Transaction rolled back." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get("limit") || "30", 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 30 : limitParam, 1), 100);

  try {
    const recentSales = await db.query.sales.findMany({
      orderBy: [desc(sales.createdAt)],
      limit,
      with: {
        cashier: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    const formattedSales = recentSales.map((s) => ({
      sale: {
        id: s.id,
        cashierId: s.cashierId,
        cashierName: s.cashier?.name || "Cashier",
        cashierEmail: s.cashier?.email || "",
        total: s.total,
        createdAt: s.createdAt,
      },
      items: s.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        title: item.product?.title || "Unknown Book",
        author: item.product?.author,
        isbn: item.product?.isbn,
        sku: item.product?.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
      })),
    }));

    return NextResponse.json({ sales: formattedSales });
  } catch (error: any) {
    console.error("Failed to fetch sales history:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkout history" },
      { status: 500 }
    );
  }
}


