export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-7 pb-16 animate-pulse max-w-7xl mx-auto">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-2 h-4 w-72 rounded-lg bg-slate-200/70 dark:bg-white/5" />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-32 rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      {/* 2. Timeframe Selector Pills Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 backdrop-blur-xl">
        <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/10 ml-1" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      {/* 3. Hero KPI Cards Skeleton (Gross Sales & Net Profit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Hero Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-5 sm:p-7 backdrop-blur-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="h-10 sm:h-12 w-56 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-3/4 rounded bg-slate-200/70 dark:bg-white/5" />
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-2">
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
          </div>
        </div>

        {/* Profit Hero Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-5 sm:p-7 backdrop-blur-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="h-10 sm:h-12 w-56 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-3/4 rounded bg-slate-200/70 dark:bg-white/5" />
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-2">
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
          </div>
        </div>
      </div>

      {/* 4. Comparison Table Skeleton */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 backdrop-blur-2xl space-y-4">
        <div className="space-y-1">
          <div className="h-5 w-52 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-64 rounded bg-slate-200/70 dark:bg-white/5" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-12 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
            />
          ))}
        </div>
      </div>

      {/* 5. Two Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Column (7 cols): Items Table */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 backdrop-blur-2xl space-y-4">
          <div className="h-5 w-60 rounded bg-slate-200 dark:bg-white/10" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="h-14 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
              />
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Categories & Feed */}
        <div className="lg:col-span-5 flex flex-col gap-7">
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 backdrop-blur-2xl space-y-4">
            <div className="h-5 w-44 rounded bg-slate-200 dark:bg-white/10" />
            <div className="space-y-4">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-white/10" />
                    <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-white/10" />
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-6 backdrop-blur-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-44 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-16 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

