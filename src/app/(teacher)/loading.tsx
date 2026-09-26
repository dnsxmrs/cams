export default function TeacherLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-900 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-blue-200 dark:bg-blue-950/60 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/80 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" />
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
