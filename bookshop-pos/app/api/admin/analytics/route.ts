import { auth } from "@/auth";
import { db } from "@/db";
import { products, saleItems, sales, users } from "@/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
  const range = searchParams.get("range") || "all"; // "today" | "week" | "month" | "all"

  try {
    const now = new Date();

    // 1. Date boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Helper query for sales & profit calculation for a given date threshold
    async function getSalesAndProfit(sinceDate?: Date) {
      const whereCondition = sinceDate ? gte(sales.createdAt, sinceDate) : undefined;

      const [res] = await db
        .select({
          totalSales: sql<string>`coalesce(cast(sum(${saleItems.quantity} * ${saleItems.unitPrice}) as numeric(12, 2)), '0.00')`,
          totalCost: sql<string>`coalesce(cast(sum(${saleItems.quantity} * coalesce(${products.cost}, 0)) as numeric(12, 2)), '0.00')`,
          totalProfit: sql<string>`coalesce(cast(sum(${saleItems.quantity} * (${saleItems.unitPrice} - coalesce(${products.cost}, 0))) as numeric(12, 2)), '0.00')`,
          totalUnits: sql<number>`coalesce(cast(sum(${saleItems.quantity}) as int), 0)`,
          totalOrders: sql<number>`coalesce(cast(count(distinct ${sales.id}) as int), 0)`,
        })
        .from(sales)
        .innerJoin(saleItems, eq(sales.id, saleItems.saleId))
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(whereCondition);

      const salesNum = parseFloat(res?.totalSales || "0") || 0;
      const costNum = parseFloat(res?.totalCost || "0") || 0;
      const profitNum = parseFloat(res?.totalProfit || "0") || 0;
      const totalOrders = res?.totalOrders || 0;
      const totalUnits = res?.totalUnits || 0;
      const margin = salesNum > 0 ? ((profitNum / salesNum) * 100).toFixed(1) : "0.0";
      const aov = totalOrders > 0 ? (salesNum / totalOrders).toFixed(2) : "0.00";
      const aop = totalOrders > 0 ? (profitNum / totalOrders).toFixed(2) : "0.00";

      return {
        sales: salesNum.toFixed(2),
        cost: costNum.toFixed(2),
        profit: profitNum.toFixed(2),
        margin,
        orders: totalOrders,
        units: totalUnits,
        aov,
        aop,
      };
    }

    // 2. Fetch summaries for Today, This Week, This Month, and All Time
    const [todayStats, weekStats, monthStats, allTimeStats] = await Promise.all([
      getSalesAndProfit(startOfToday),
      getSalesAndProfit(startOfWeek),
      getSalesAndProfit(startOfMonth),
      getSalesAndProfit(),
    ]);

    // 3. Determine current active range filter
    let activeRangeDate: Date | undefined;
    if (range === "today") activeRangeDate = startOfToday;
    else if (range === "week") activeRangeDate = startOfWeek;
    else if (range === "month") activeRangeDate = startOfMonth;

    const rangeCondition = activeRangeDate ? gte(sales.createdAt, activeRangeDate) : undefined;

    // 4. Profit & Sales breakdown by Item for selected range
    const itemsProfitRaw = await db
      .select({
        productId: saleItems.productId,
        title: sql<string>`coalesce(${products.title}, 'Unknown Product')`,
        category: sql<string>`coalesce(${products.category}, 'General')`,
        unitsSold: sql<number>`cast(sum(${saleItems.quantity}) as int)`,
        revenue: sql<string>`cast(sum(${saleItems.quantity} * ${saleItems.unitPrice}) as numeric(10, 2))`,
        cost: sql<string>`cast(sum(${saleItems.quantity} * coalesce(${products.cost}, 0)) as numeric(10, 2))`,
        profit: sql<string>`cast(sum(${saleItems.quantity} * (${saleItems.unitPrice} - coalesce(${products.cost}, 0))) as numeric(10, 2))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(rangeCondition)
      .groupBy(saleItems.productId, products.title, products.category)
      .orderBy(desc(sql`sum(${saleItems.quantity} * (${saleItems.unitPrice} - coalesce(${products.cost}, 0)))`))
      .limit(10);

    const profitByItem = itemsProfitRaw.map((it) => {
      const rev = parseFloat(it.revenue) || 0;
      const prf = parseFloat(it.profit) || 0;
      const cst = parseFloat(it.cost) || 0;
      const margin = rev > 0 ? ((prf / rev) * 100).toFixed(1) : "0.0";
      const unitProfit = it.unitsSold > 0 ? (prf / it.unitsSold).toFixed(2) : "0.00";
      return {
        productId: it.productId,
        title: it.title,
        category: it.category,
        unitsSold: it.unitsSold,
        revenue: rev.toFixed(2),
        cost: cst.toFixed(2),
        profit: prf.toFixed(2),
        margin,
        unitProfit,
      };
    });

    // 5. Profit & Sales breakdown by Category for selected range
    const categoryProfitRaw = await db
      .select({
        category: sql<string>`coalesce(${products.category}, 'General')`,
        unitsSold: sql<number>`cast(sum(${saleItems.quantity}) as int)`,
        revenue: sql<string>`cast(sum(${saleItems.quantity} * ${saleItems.unitPrice}) as numeric(10, 2))`,
        cost: sql<string>`cast(sum(${saleItems.quantity} * coalesce(${products.cost}, 0)) as numeric(10, 2))`,
        profit: sql<string>`cast(sum(${saleItems.quantity} * (${saleItems.unitPrice} - coalesce(${products.cost}, 0))) as numeric(10, 2))`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(rangeCondition)
      .groupBy(sql`coalesce(${products.category}, 'General')`)
      .orderBy(desc(sql`sum(${saleItems.quantity} * (${saleItems.unitPrice} - coalesce(${products.cost}, 0)))`));

    const rangeProfitTotal = categoryProfitRaw.reduce((sum, c) => sum + (parseFloat(c.profit) || 0), 0);

    const profitByCategory = categoryProfitRaw.map((c) => {
      const rev = parseFloat(c.revenue) || 0;
      const prf = parseFloat(c.profit) || 0;
      const cst = parseFloat(c.cost) || 0;
      const margin = rev > 0 ? ((prf / rev) * 100).toFixed(1) : "0.0";
      const shareOfProfit = rangeProfitTotal > 0 ? Math.round((prf / rangeProfitTotal) * 100) : 0;
      return {
        category: c.category,
        unitsSold: c.unitsSold,
        revenue: rev.toFixed(2),
        cost: cst.toFixed(2),
        profit: prf.toFixed(2),
        margin,
        shareOfProfit,
      };
    });

    // 6. Real-time Recent Sales Feed with Profit per sale
    const recentSalesRaw = await db
      .select({
        id: sales.id,
        createdAt: sales.createdAt,
        cashierName: sql<string>`coalesce(${users.name}, 'Cashier')`,
        totalSales: sql<string>`cast(sum(${saleItems.quantity} * ${saleItems.unitPrice}) as numeric(10, 2))`,
        totalCost: sql<string>`cast(sum(${saleItems.quantity} * coalesce(${products.cost}, 0)) as numeric(10, 2))`,
        profit: sql<string>`cast(sum(${saleItems.quantity} * (${saleItems.unitPrice} - coalesce(${products.cost}, 0))) as numeric(10, 2))`,
        totalUnits: sql<number>`coalesce(cast(sum(${saleItems.quantity}) as int), 0)`,
        itemCount: sql<number>`coalesce(cast(count(${saleItems.id}) as int), 0)`,
      })
      .from(sales)
      .innerJoin(users, eq(sales.cashierId, users.id))
      .innerJoin(saleItems, eq(sales.id, saleItems.saleId))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .groupBy(sales.id, sales.createdAt, users.name)
      .orderBy(desc(sales.createdAt))
      .limit(8);

    const recentSalesWithProfit = recentSalesRaw.map((s) => {
      const rev = parseFloat(s.totalSales) || 0;
      const prf = parseFloat(s.profit) || 0;
      const margin = rev > 0 ? ((prf / rev) * 100).toFixed(1) : "0.0";
      return {
        id: s.id,
        createdAt: s.createdAt,
        cashierName: s.cashierName,
        totalSales: rev.toFixed(2),
        profit: prf.toFixed(2),
        margin,
        totalUnits: s.totalUnits,
        itemCount: s.itemCount,
      };
    });

    return NextResponse.json({
      range,
      periods: {
        today: todayStats,
        week: weekStats,
        month: monthStats,
        all: allTimeStats,
      },
      profitByItem,
      profitByCategory,
      recentSales: recentSalesWithProfit,
    });
  } catch (error: any) {
    console.error("Failed to compile sales and profit analytics:", error);
    return NextResponse.json(
      { error: "Failed to calculate sales and profit metrics" },
      { status: 500 }
    );
  }
}
