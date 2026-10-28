"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SalesSummary {
  revenue: string;
  transactions: number;
  units: number;
}

interface TopProduct {
  productId: number;
  title: string;
  author: string | null;
  isbn: string | null;
  sku: string | null;
  unitsSold: number;
  revenue: string;
}

interface LowStockProduct {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  sku: string | null;
  category: string | null;
  price: string;
  quantity: number;
  reorderThreshold: number;
}

interface NearingStockoutProduct {
  productId: number;
  title: string;
  author: string | null;
  isbn: string | null;
  currentStock: number;
  reorderThreshold: number;
  unitsSoldInWindow: number;
  dailyVelocity: number;
  estimatedDaysLeft: number | null;
}

interface DailySale {
  dayDate: string;
  dailyTotal: string;
  transactionCount: number;
}

interface AnalyticsData {
  summary: {
    today: SalesSummary;
    thisWeek: SalesSummary;
    thisMonth: SalesSummary;
  };
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  nearingStockout: NearingStockoutProduct[];
  dailySales: DailySale[];
  range: string;
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<"day" | "week" | "month" | "all">("week");

  async function fetchAnalytics(range: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (!res.ok) {
        throw new Error("Failed to load analytics data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading dashboard metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [selectedRange]);

  const maxDailyRevenue = data?.dailySales?.length
    ? Math.max(...data.dailySales.map((d) => parseFloat(d.dailyTotal) || 0), 100)
    : 100;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Sales & Inventory Analytics</span>
            <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/35 shadow-sm shadow-[#1ecbe1]/10">
              Admin Insights
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Real-time revenue metrics, top-selling items, and predictive stock depletion estimates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnalytics(selectedRange)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2 text-xs font-bold text-slate-800 dark:text-white hover:border-[#1ecbe1] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-cyan-700 dark:hover:text-[#1ecbe1] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className={`h-3.5 w-3.5 text-cyan-600 dark:text-[#1ecbe1] ${loading ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products"
            className="rounded-xl border border-cyan-300 dark:border-[#1ecbe1]/40 bg-cyan-100 dark:bg-[#1ecbe1]/10 px-4 py-2 text-xs font-extrabold text-cyan-800 dark:text-[#1ecbe1] hover:bg-cyan-200 dark:hover:bg-[#1ecbe1]/20 active:scale-95 transition-all shadow-sm"
          >
            Manage Products &rarr;
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between backdrop-blur-md">
          <span>{error}</span>
          <button onClick={() => fetchAnalytics(selectedRange)} className="font-bold underline ml-4 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards: Today, This Week, This Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Sales */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-2xl hover:border-[#1ecbe1] transition-all group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Today's Sales</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-600 dark:text-[#1ecbe1] tracking-tight drop-shadow-[0_0_12px_rgba(30,203,225,0.3)]">
              Rs. {data ? data.summary.today.revenue : "0.00"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
            <span>
              <strong className="text-slate-900 dark:text-white">{data?.summary.today.transactions || 0}</strong> orders
            </span>
            <span>
              <strong className="text-slate-900 dark:text-white">{data?.summary.today.units || 0}</strong> units sold
            </span>
          </div>
        </div>

        {/* This Week */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-2xl hover:border-[#1ecbe1] transition-all group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Past 7 Days</span>
            <span className="text-cyan-800 dark:text-[#1ecbe1] text-xs font-mono font-bold bg-cyan-100 dark:bg-[#1ecbe1]/10 px-2 py-0.5 rounded-full border border-cyan-300 dark:border-[#1ecbe1]/30">Week</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rs. {data ? data.summary.thisWeek.revenue : "0.00"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
            <span>
              <strong className="text-slate-900 dark:text-white">{data?.summary.thisWeek.transactions || 0}</strong> orders
            </span>
            <span>
              <strong className="text-slate-900 dark:text-white">{data?.summary.thisWeek.units || 0}</strong> units sold
            </span>
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-2xl hover:border-[#1ecbe1] transition-all group">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>This Month</span>
            <span className="text-purple-700 dark:text-purple-400 text-xs font-mono font-bold bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-500/30">Month</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rs. {data ? data.summary.thisMonth.revenue : "0.00"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3">
            <span>
              <strong className="text-slate-900 dark:text-white">{data?.summary.thisMonth.transactions || 0}</strong> orders
            </span>
            <span>
              <strong className="text-slate-900 dark:text-white">{data?.summary.thisMonth.units || 0}</strong> units sold
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Over Time (14-Day Trend Chart) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">14-Day Revenue Trend</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily revenue totals from checkout transactions.
            </p>
          </div>
        </div>

        {data?.dailySales && data.dailySales.length > 0 ? (
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-200 dark:border-white/10">
              {data.dailySales.map((day) => {
                const heightPercent = Math.max(
                  Math.round(((parseFloat(day.dailyTotal) || 0) / maxDailyRevenue) * 100),
                  6
                );
                return (
                  <div
                    key={day.dayDate}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-950/95 text-white text-[10px] font-mono px-2.5 py-1 rounded-xl shadow-xl pointer-events-none whitespace-nowrap z-20 border border-[#1ecbe1]/40">
                      Rs. {parseFloat(day.dailyTotal).toFixed(2)} ({day.transactionCount} orders)
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-[#0891b2] to-[#1ecbe1] hover:from-[#06b6d4] hover:to-[#38d8ec] hover:shadow-[0_0_14px_rgba(30,203,225,0.5)] transition-all shadow-md cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {data.dailySales.map((day) => (
                <div key={day.dayDate} className="flex-1 text-center truncate">
                  {day.dayDate.slice(5)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No sales recorded in the past 14 days yet. Process checkouts in POS to populate charts.
          </div>
        )}
      </div>

      {/* Grid: Left Top-Selling Products & Right Low-Stock / Stockout Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Top-Selling Products (6 cols) */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Top-Selling Items</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Highest quantity sold during the period.
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-white/[0.04] p-1 border border-slate-200 dark:border-white/10 text-[11px] backdrop-blur-md">
              {(
                [
                  { key: "day", label: "Today" },
                  { key: "week", label: "7 Days" },
                  { key: "month", label: "30 Days" },
                  { key: "all", label: "All Time" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRange(tab.key)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all active:scale-95 cursor-pointer ${
                    selectedRange === tab.key
                      ? "bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 shadow-md shadow-[#1ecbe1]/30 font-extrabold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto pos-scrollbar">
            {data?.topProducts && data.topProducts.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-2">#</th>
                    <th className="py-2.5 px-3">Item & Brand</th>
                    <th className="py-2.5 px-2 text-center">Qty Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.topProducts.map((p, idx) => (
                    <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {p.author || "Unknown"} {p.isbn ? `• ${p.isbn}` : ""}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] font-extrabold text-xs border border-cyan-300 dark:border-[#1ecbe1]/30">
                          {p.unitsSold}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-cyan-600 dark:text-[#1ecbe1]">
                        Rs. {parseFloat(p.revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                No items sold in this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Predictive "Nearing Stockout" & Low-Stock Alerts (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Nearing Stockout Predictive Model */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Nearing Stockout Estimates</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/30">
                    Predictive
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Estimated days until inventory hits zero based on past 14-day sales velocity (
                <span className="text-slate-700 dark:text-slate-300">stock_movements with reason='sale'</span>).
              </p>
            </div>

            {/* Disclaimer banner */}
            <div className="mb-4 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed backdrop-blur-md">
              <strong className="text-slate-900 dark:text-white font-semibold">Soft Estimate:</strong> Run-rate calculations
              assume current demand trends continue. Actual sales may vary with seasonality or promotions.
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pos-scrollbar pr-1">
              {data?.nearingStockout && data.nearingStockout.length > 0 ? (
                data.nearingStockout.map((item) => {
                  const isStockedOut = item.currentStock === 0;
                  const isUrgent = item.estimatedDaysLeft !== null && item.estimatedDaysLeft <= 5;

                  return (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] p-3 hover:border-[#1ecbe1] transition-all flex items-center justify-between gap-3 text-xs backdrop-blur-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Stock: <strong className="text-slate-800 dark:text-slate-200">{item.currentStock}</strong></span>
                          <span>&bull;</span>
                          <span>Velocity: <strong className="text-slate-800 dark:text-slate-200">{item.dailyVelocity} / day</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isStockedOut ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-500/30">
                            0 Days &bull; Out of Stock
                          </span>
                        ) : item.estimatedDaysLeft !== null ? (
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold border ${
                              isUrgent
                                ? "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
                                : "bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] border-cyan-300 dark:border-[#1ecbe1]/30"
                            }`}
                          >
                            ~{item.estimatedDaysLeft} {item.estimatedDaysLeft === 1 ? "day" : "days"} left
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            No recent sales
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No products are currently nearing stockout.
                </div>
              )}
            </div>
          </div>

          {/* Low Stock List: products where quantity <= reorderThreshold */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Low-Stock Inventory</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold">
                    {data?.lowStockProducts.length || 0}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Items at or below reorder threshold (quantity &le; threshold).
                </p>
              </div>

              <Link
                href="/admin/products"
                className="text-xs text-cyan-600 dark:text-[#1ecbe1] hover:underline font-bold"
              >
                Reorder
              </Link>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pos-scrollbar pr-1">
              {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                data.lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] p-3 flex items-center justify-between gap-3 text-xs backdrop-blur-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{p.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.author || "Unknown"} {p.isbn ? `• ${p.isbn}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">{p.quantity}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]"> / {p.reorderThreshold} thres.</span>
                      </div>
                      <Link
                        href={`/admin/products`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 font-bold transition-all text-[11px] active:scale-95"
                      >
                        Adjust
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ All products are currently above their reorder thresholds!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

