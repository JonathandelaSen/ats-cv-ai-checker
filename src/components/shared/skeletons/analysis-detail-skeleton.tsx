import { Skeleton } from "@/components/ui/skeleton";

export function AnalysisDetailSkeleton() {
  return (
    <div className="w-full space-y-5">
      {/* Score Hero */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="shrink-0 w-32 h-32 rounded-full" />
          <div className="flex-1 space-y-3 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-10 w-28 rounded-2xl" />
        <Skeleton className="h-10 w-24 rounded-2xl" />
        <Skeleton className="h-10 w-32 rounded-2xl" />
        <Skeleton className="h-10 w-20 rounded-2xl" />
        <Skeleton className="h-10 w-32 rounded-2xl" />
      </div>

      {/* Tab content */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
