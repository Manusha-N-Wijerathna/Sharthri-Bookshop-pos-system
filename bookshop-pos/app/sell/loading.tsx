export default function SellLoading() {
  return (
    <div className="flex flex-col gap-4 pb-12 animate-pulse max-w-7xl mx-auto">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="space-y-1.5">
            <div className="h-5 w-48 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-32 rounded bg-slate-200/70 dark:bg-white/5" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Search, Categories & Catalog Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Search bar & quick filters */}
          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl space-y-3">
            <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="h-3.5 w-32 rounded bg-slate-200/70 dark:bg-white/5" />
              <div className="h-3.5 w-16 rounded bg-slate-200/70 dark:bg-white/5" />
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex flex-col justify-between h-36"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 w-20 rounded-md bg-slate-200 dark:bg-white/10" />
                      <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-white/10" />
                    </div>
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10 mb-1.5" />
                    <div className="h-3 w-1/2 rounded bg-slate-200/70 dark:bg-white/5" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/10" />
                    <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Cart & Tender (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-5 w-14 rounded-full bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-white/10" />
            </div>

            {/* Cart Items Placeholder */}
            <div className="space-y-2.5 py-2">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
                    <div className="h-3 w-20 rounded bg-slate-200/70 dark:bg-white/5" />
                  </div>
                  <div className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-14 rounded bg-slate-200 dark:bg-white/10" />
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-7 w-28 rounded bg-slate-200 dark:bg-white/10" />
              </div>
            </div>

            {/* Payment Method Pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>

            {/* Checkout Action Button */}
            <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

