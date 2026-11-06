export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-2 h-4 w-80 rounded-lg bg-slate-200/70 dark:bg-white/5" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-white/10 self-start sm:self-auto" />
      </div>

      {/* Filter Controls Skeleton */}
      <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="h-10 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="h-10 w-full sm:w-32 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="h-10 w-full sm:w-44 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="h-10 w-full sm:w-32 rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </div>

      {/* Products Table & Card Container Skeleton */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {/* Desktop Table View Skeleton */}
        <div className="hidden md:block">
          <div className="border-b border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-900/80 px-5 py-3.5 flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/10" />
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-white/5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4.5 w-48 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-3.5 w-28 rounded bg-slate-200/70 dark:bg-white/5" />
                </div>
                <div className="h-6 w-24 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/10 font-mono" />
                <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/10 text-right" />
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-8 w-14 rounded-xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="block md:hidden p-3 space-y-3">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-32 rounded bg-slate-200/70 dark:bg-white/5" />
              </div>
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-white/5" />
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <div className="h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
                <div className="h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
                <div className="h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
                <div className="h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

