import { auth } from "@/auth";
import { db } from "@/db";
import { products, saleItems, sales, stockMovements } from "@/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "week"; // "day" | "week" | "month" | "all"

  try {
    const now = new Date();

    // 1. Calculate Date Boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of current week (last 7 days)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of current month (1st of month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Query Sales Summary (Today, This Week, This Month)
    // Directly querying sales and sale_items (never recomputing from products)
    const [todaySummary] = await db
      .select({
        revenue: sql<string>`coalesce(sum(${sales.total}), '0.00')`,
        salesCount: sql<number>`cast(count(${sales.id}) as int)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, startOfToday));

    const [todayUnits] = await db
      .select({
        units: sql<number>`coalesce(cast(sum(${saleItems.quantity}) as int), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.createdAt, startOfToday));

    const [weekSummary] = await db
      .select({
        revenue: sql<string>`coalesce(sum(${sales.total}), '0.00')`,
        salesCount: sql<number>`cast(count(${sales.id}) as int)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, startOfWeek));

    const [weekUnits] = await db
      .select({
        units: sql<number>`coalesce(cast(sum(${saleItems.quantity}) as int), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.createdAt, startOfWeek));

    const [monthSummary] = await db
      .select({
        revenue: sql<string>`coalesce(sum(${sales.total}), '0.00')`,
        salesCount: sql<number>`cast(count(${sales.id}) as int)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, startOfMonth));

    const [monthUnits] = await db
      .select({
        units: sql<number>`coalesce(cast(sum(${saleItems.quantity}) as int), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(gte(sales.createdAt, startOfMonth));

    // 3. Top-Selling Products based on selected range
    let topRangeDate: Date | null = null;
    if (range === "day") {
      topRangeDate = startOfToday;
    } else if (range === "week") {
      topRangeDate = startOfWeek;
    } else if (range === "month") {
      topRangeDate = startOfMonth;
    }

    const topFilter = topRangeDate ? gte(sales.createdAt, topRangeDate) : undefined;

    const topProducts = await db
      .select({
        productId: saleItems.productId,
        title: products.title,
        author: products.author,
        isbn: products.isbn,
        sku: products.sku,
        unitsSold: sql<number>`cast(sum(${saleItems.quantity}) as int)`,
        revenue: sql<string>`cast(sum(${saleItems.quantity} * ${saleItems.unitPrice}) as numeric(10, 2))`,
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(topFilter)
      .groupBy(saleItems.productId, products.title, products.author, products.isbn, products.sku)
      .orderBy(desc(sql`sum(${saleItems.quantity})`))
      .limit(10);

    // 4. Low-Stock List: quantity <= reorderThreshold
    const lowStockProducts = await db
      .select({
        id: products.id,
        title: products.title,
        author: products.author,
        isbn: products.isbn,
        sku: products.sku,
        category: products.category,
        price: products.price,
        quantity: products.quantity,
        reorderThreshold: products.reorderThreshold,
      })
      .from(products)
      .where(lte(products.quantity, products.reorderThreshold))
      .orderBy(products.quantity, products.title);

    // 5. "Nearing Stockout" Estimate:
    // Lookback window: past 14 days of stock_movements with reason = 'sale'
    const windowDays = 14;
    const windowStartDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const movementAggregates = await db
      .select({
        productId: stockMovements.productId,
        unitsSold: sql<number>`cast(abs(sum(${stockMovements.change})) as int)`,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.reason, "sale"),
          gte(stockMovements.createdAt, windowStartDate)
        )
      )
      .groupBy(stockMovements.productId);

    const movementMap = new Map<number, number>();
    for (const m of movementAggregates) {
      movementMap.set(m.productId, m.unitsSold);
    }

    // Fetch active products
    const allProducts = await db
      .select({
        id: products.id,
        title: products.title,
        author: products.author,
        isbn: products.isbn,
        quantity: products.quantity,
        reorderThreshold: products.reorderThreshold,
      })
      .from(products);

    const nearingStockout = allProducts
      .map((p) => {
        const unitsSoldInWindow = movementMap.get(p.id) || 0;
        const dailyVelocity = unitsSoldInWindow / windowDays;
        let estimatedDaysLeft: number | null = null;

        if (p.quantity === 0) {
          estimatedDaysLeft = 0;
        } else if (dailyVelocity > 0) {
          estimatedDaysLeft = Math.round(p.quantity / dailyVelocity);
        }

        return {
          productId: p.id,
          title: p.title,
          author: p.author,
          isbn: p.isbn,
          currentStock: p.quantity,
          reorderThreshold: p.reorderThreshold,
          unitsSoldInWindow,
          dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
          estimatedDaysLeft,
        };
      })
      .filter(
        (p) =>
          p.currentStock === 0 ||
          (p.estimatedDaysLeft !== null && p.estimatedDaysLeft <= 30) ||
          p.currentStock <= p.reorderThreshold
      )
      .sort((a, b) => {
        if (a.estimatedDaysLeft === null) return 1;
        if (b.estimatedDaysLeft === null) return -1;
        return a.estimatedDaysLeft - b.estimatedDaysLeft;
      })
      .slice(0, 15);

    // 6. Recent Daily Sales (for lightweight visual bar chart over last 14 days)
    const chartStartDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const dailySales = await db
      .select({
        dayDate: sql<string>`to_char(${sales.createdAt}, 'YYYY-MM-DD')`,
        dailyTotal: sql<string>`coalesce(sum(${sales.total}), '0.00')`,
        transactionCount: sql<number>`cast(count(${sales.id}) as int)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, chartStartDate))
      .groupBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${sales.createdAt}, 'YYYY-MM-DD')`);

    return NextResponse.json({
      summary: {
        today: {
          revenue: parseFloat(todaySummary.revenue).toFixed(2),
          transactions: todaySummary.salesCount,
          units: todayUnits.units,
        },
        thisWeek: {
          revenue: parseFloat(weekSummary.revenue).toFixed(2),
          transactions: weekSummary.salesCount,
          units: weekUnits.units,
        },
        thisMonth: {
          revenue: parseFloat(monthSummary.revenue).toFixed(2),
          transactions: monthSummary.salesCount,
          units: monthUnits.units,
        },
      },
      topProducts,
      lowStockProducts,
      nearingStockout,
      dailySales,
      range,
    });
  } catch (error: any) {
    console.error("Failed to compile analytics:", error);
    return NextResponse.json(
      { error: "Failed to load analytics dashboard data" },
      { status: 500 }
    );
  }
}

