"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnalyticsLoading from "./loading";

interface PeriodMetric {
  sales: string;
  cost: string;
  profit: string;
  margin: string;
  orders: number;
  units: number;
  aov: string;
  aop: string;
}

interface ProfitItem {
  productId: number;
  title: string;
  category: string;
  unitsSold: number;
  revenue: string;
  cost: string;
  profit: string;
  margin: string;
  unitProfit: string;
}

interface ProfitCategory {
  category: string;
  unitsSold: number;
  revenue: string;
  cost: string;
  profit: string;
  margin: string;
  shareOfProfit: number;
}

interface RecentSaleProfit {
  id: number;
  createdAt: string;
  cashierName: string;
  totalSales: string;
  profit: string;
  margin: string;
  totalUnits: number;
  itemCount: number;
}

interface AnalyticsPayload {
  range: "today" | "week" | "month" | "all";
  periods: {
    today: PeriodMetric;
    week: PeriodMetric;
    month: PeriodMetric;
    all: PeriodMetric;
  };
  profitByItem: ProfitItem[];
  profitByCategory: ProfitCategory[];
  recentSales: RecentSaleProfit[];
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "month" | "all">("today");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function fetchAnalytics(range: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      if (!res.ok || !json.periods) {
        throw new Error(json.error || "Failed to load real-time sales and profit data");
      }
      setData(json);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [selectedRange]);

  // Current active period metric
  const activeMetric: PeriodMetric = data?.periods?.[selectedRange] || {
    sales: "0.00",
    cost: "0.00",
    profit: "0.00",
    margin: "0.0",
    orders: 0,
    units: 0,
    aov: "0.00",
    aop: "0.00",
  };

  const rangeLabels: Record<string, string> = {
    today: "Today",
    week: "Past 7 Days",
    month: "This Month",
    all: "All Time",
  };

  if (loading && !data) {
    return <AnalyticsLoading />;
  }

  return (
    <div className="flex flex-col gap-7 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* 1. Header with Real-Time Pulse & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Real-Time Sales & Profit
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track gross sales, cost of goods, and net profit earned from items sold. Updated at{" "}
            {lastUpdated.toLocaleTimeString()}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAnalytics(selectedRange)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white hover:border-[#1ecbe1] hover:bg-slate-100 dark:hover:bg-white/10 hover:text-cyan-700 dark:hover:text-[#1ecbe1] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className={`h-4 w-4 text-cyan-600 dark:text-[#1ecbe1] ${loading ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link
            href="/sell"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300 dark:border-[#1ecbe1]/40 bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 font-extrabold px-4 py-2 text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#1ecbe1]/20 cursor-pointer"
          >
            <span>POS Checkout</span>
            <span className="text-sm leading-none">&rarr;</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between backdrop-blur-md">
          <span>{error}</span>
          <button
            onClick={() => fetchAnalytics(selectedRange)}
            className="font-bold underline ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Timeframe Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 backdrop-blur-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pl-1">
          Select Period:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 pos-scrollbar">
          {(
            [
              { key: "today", label: "Today" },
              { key: "week", label: "Past 7 Days" },
              { key: "month", label: "This Month" },
              { key: "all", label: "All Time" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedRange(tab.key)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${
                selectedRange === tab.key
                  ? "bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 shadow-md shadow-[#1ecbe1]/30 font-extrabold"
                  : "bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Hero Cards: Total Sales vs Total Profit for Selected Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Total Sales Card */}
        <div className="rounded-3xl border border-cyan-300/80 dark:border-[#1ecbe1]/40 bg-gradient-to-br from-cyan-50/90 via-white to-sky-50/80 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-cyan-950/30 p-5 sm:p-7 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-[#1ecbe1]">
            <span>Total Sales ({rangeLabels[selectedRange]})</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] font-mono border border-cyan-300 dark:border-[#1ecbe1]/30">
              Gross Revenue
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight drop-shadow-sm">
              Rs. {activeMetric.sales}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Total money collected from selling items during this period.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 border-t border-cyan-200/60 dark:border-white/10 pt-4 text-xs">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-cyan-200/60 dark:border-white/10">
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">
                Orders
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {activeMetric.orders}
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-cyan-200/60 dark:border-white/10">
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">
                Units Sold
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {activeMetric.units}
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-cyan-200/60 dark:border-white/10">
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">
                Avg. Order
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-cyan-700 dark:text-[#1ecbe1] mt-0.5 truncate">
                Rs. {activeMetric.aov}
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Profit Earned Card */}
        <div className="rounded-3xl border border-emerald-300/80 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-emerald-950/30 p-5 sm:p-7 shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <span>Net Profit Earned ({rangeLabels[selectedRange]})</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-mono font-extrabold border border-emerald-300 dark:border-emerald-500/30">
              {activeMetric.margin}% Margin
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              Rs. {activeMetric.profit}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Net take-home profit earned after deducting product wholesale cost (<code className="text-emerald-700 dark:text-emerald-400 font-bold">Sales - Cost</code>).
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 border-t border-emerald-200/60 dark:border-white/10 pt-4 text-xs">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10">
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">
                Item Cost (COGS)
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                Rs. {activeMetric.cost}
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10">
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">
                Profit Margin
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {activeMetric.margin}%
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10">
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">
                Avg. Profit / Order
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                Rs. {activeMetric.aop}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real-Time Period Comparison Table (Today, 7 Days, Month, All-Time) */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Sales & Profit Across All Periods
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quick side-by-side comparison of revenue, wholesale cost, and net profit.
          </p>
        </div>

        <div className="overflow-x-auto pos-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3 text-right">Total Sales</th>
                <th className="py-3 px-3 text-right">Total Cost</th>
                <th className="py-3 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                  Net Profit Earned
                </th>
                <th className="py-3 px-3 text-center">Profit Margin</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-3 text-center">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
              {[
                { label: "Today", p: data?.periods?.today, active: selectedRange === "today" },
                { label: "Past 7 Days", p: data?.periods?.week, active: selectedRange === "week" },
                { label: "This Month", p: data?.periods?.month, active: selectedRange === "month" },
                { label: "All Time", p: data?.periods?.all, active: selectedRange === "all" },
              ].map(({ label, p, active }) => (
                <tr
                  key={label}
                  className={`transition-colors ${
                    active
                      ? "bg-cyan-50/80 dark:bg-[#1ecbe1]/10 font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{label}</span>
                      {active && (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-[#1ecbe1] text-slate-950">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                    Rs. {p?.sales || "0.00"}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-400">
                    Rs. {p?.cost || "0.00"}
                  </td>
                  <td className="py-3.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    Rs. {p?.profit || "0.00"}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-500/30">
                      {p?.margin || "0.0"}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-300">
                    {p?.orders || 0}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-300">
                    {p?.units || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Two Columns: Left Most Profitable Items Sold | Right Category Profit Share & Live Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Column (7 cols): Items Selling & Profit Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-7">
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Most Profitable Items Sold ({rangeLabels[selectedRange]})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Items ranked by highest net profit earned.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pos-scrollbar">
              {data?.profitByItem && data.profitByItem.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Sales</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                        Profit Earned
                      </th>
                      <th className="py-2.5 px-2 text-center">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {data.profitByItem.map((item, idx) => (
                      <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <td className="py-3 px-2 font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-cyan-700 dark:text-[#1ecbe1]">
                            {item.category}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                          {item.unitsSold}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                          Rs. {item.revenue}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          Rs. {item.profit}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-300 dark:border-emerald-500/30">
                            {item.margin}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  No sales recorded for this timeframe yet. Process checkouts in the POS terminal to see profit!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Profit by Category & Live Sales Feed */}
        <div className="lg:col-span-5 flex flex-col gap-7">
          {/* Category Profit Share */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Profit by Category ({rangeLabels[selectedRange]})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Which departments yield the most profit for the bookshop.
              </p>
            </div>

            {data?.profitByCategory && data.profitByCategory.length > 0 ? (
              <div className="space-y-4">
                {data.profitByCategory.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {cat.category}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                          ({cat.unitsSold} sold)
                        </span>
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        Rs. {cat.profit} ({cat.margin}% margin)
                      </span>
                    </div>

                    {/* Progress Bar showing share of shop profit */}
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-200/60 dark:border-white/5">
                      <div
                        style={{ width: `${Math.max(cat.shareOfProfit, 5)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#1ecbe1] shadow-[0_0_10px_rgba(30,203,225,0.4)] transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No category sales recorded for this period yet.
              </div>
            )}
          </div>

          {/* Real-Time Live Sales & Profit Feed */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Live Sales & Profit Feed
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time profit made on each recent sale.
                </p>
              </div>

              <span className="h-2 w-2 rounded-full bg-[#1ecbe1] animate-pulse shadow-[0_0_8px_#1ecbe1]"></span>
            </div>

            <div className="space-y-2.5">
              {data?.recentSales && data.recentSales.length > 0 ? (
                data.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs backdrop-blur-sm"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-700 dark:text-[#1ecbe1]">
                          Sale #{sale.id}
                        </span>
                        <span className="text-slate-900 dark:text-white font-semibold truncate">
                          {sale.cashierName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          ({sale.totalUnits} items)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &bull;{" "}
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        Sale: Rs. {sale.totalSales}
                      </div>
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        + Rs. {sale.profit} <span className="text-[10px] font-bold">({sale.margin}%)</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No sales logged yet. Complete a checkout in POS to see profit live!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
